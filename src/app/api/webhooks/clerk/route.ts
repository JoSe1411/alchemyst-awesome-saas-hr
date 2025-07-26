import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    user_id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string;
    last_name: string;
    unsafe_metadata: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const { id, email_addresses, first_name, last_name, unsafe_metadata } = evt.data;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(id, email_addresses, first_name, last_name, unsafe_metadata);
        break;
      case 'user.updated':
        await handleUserUpdated(id, email_addresses, first_name, last_name, unsafe_metadata);
        break;
      case 'user.deleted':
        await handleUserDeleted(id);
        break;
      case 'session.created':
        await handleSessionCreated(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleUserCreated(
  clerkId: string,
  emailAddresses: Array<{ email_address: string }>,
  firstName: string,
  lastName: string,
  metadata: Record<string, unknown>
) {
  const email = emailAddresses[0]?.email_address;
  const { company, role, userType } = metadata || {};

  if (!email) {
    throw new Error("Email is required to create user.")
  }

  if(!userType){
     console.log("Redirect to onboarding page.");
  }

  try {
    if (userType === 'manager') {
      await prisma.manager.create({
        data: {
          id: clerkId,
          firstName: firstName || '',
          lastName: lastName || '',
          email,
          company: (company as string) || '',
          role: (role as string) || 'Manager',
          password: '', // Password is managed by Clerk
        },
      });
      console.log('✅ Manager synced to database:', email);
    }
    else if (!userType){
       console.log('Assigning default userType as "employee"');
       await prisma.employee.create({
          data:{
            id: clerkId,
            firstName: firstName || '',
            lastName: lastName || '',
            email,
            company: (company as string) || '',
            role: (role as string) || 'Employee',
            password: '', // Password is managed by Clerk 
          }
       })
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      console.log('User already exists in database:', email);
    } else {
      console.error('Error creating user in database:', error);
      throw error;
    }
  }
}

async function handleUserUpdated(
  clerkId: string,
  emailAddresses: Array<{ email_address: string }>,
  firstName: string,
  lastName: string,
  metadata: Record<string, unknown>
) {
  const email = emailAddresses[0]?.email_address;
  const { company, role, userType } = metadata || {};

  if (!email) {
    console.error('Missing email in user update:', clerkId);
    return;
  }

  try {
    const updateData: Record<string, string> = {
      firstName: firstName || '',
      lastName: lastName || '',
      email,
    };

    if (company) {
      updateData.company = company as string;
    }
    if (role) {
      updateData.role = role as string;
    }

    if (userType === 'manager') {
      await prisma.manager.update({
        where: { id: clerkId },
        data: updateData,
      });
      console.log('✅ Manager updated in database:', email);
    } else if (userType === 'employee') {
      await prisma.employee.update({
        where: { id: clerkId },
        data: updateData,
      });
      console.log('✅ Employee updated in database:', email);
    }
  } catch (error) {
    console.error('Error updating user in database:', error);
    // Don't throw to avoid blocking other webhook processing
  }
}

async function handleUserDeleted(clerkId: string) {
  try {
    // Try to delete from both tables (one will succeed, one will fail silently)
    await Promise.allSettled([
      prisma.manager.delete({ where: { id: clerkId } }),
      prisma.employee.delete({ where: { id: clerkId } }),
    ]);
    console.log('✅ User deleted from database:', clerkId);
  } catch (error) {
    console.error('Error deleting user from database:', error);
    // Don't throw to avoid blocking other webhook processing
  }
} 

async function handleSessionCreated(sessionData: { user_id: string }) {
  try {
    // Create a new session record in the database
    await prisma.loginHistory.create({
      data: { 
        userId: sessionData.user_id,
      },
    });
    console.log('✅ User login recorded:', sessionData.user_id);
  } catch (error) { 
    console.error('Error recording user login:', error);
  }
}