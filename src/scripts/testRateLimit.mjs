const TARGET = 'http://localhost:3000/api/general-chat';

   for (let i = 1; i <= 65; i++) {
     const res = await fetch(TARGET, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ message: 'ping' })
     });

     console.log(`#${i}`.padEnd(4), res.status);     // expect 200 for first 60, 429 afterwards
   }