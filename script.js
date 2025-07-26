// Three.js Scene Setup and Animation
class ThreeJSBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.mouse = { x: 0, y: 0 };
        this.windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            1000
        );
        this.camera.position.z = 400;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('three-canvas'),
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create particle system
        this.createParticles();
        
        // Create floating geometries
        this.createFloatingGeometries();
    }

    createParticles() {
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const color = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Positions
            positions[i3] = (Math.random() - 0.5) * 2000;
            positions[i3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i3 + 2] = (Math.random() - 0.5) * 1000;

            // Colors - gradient from blue to purple
            const hue = 0.6 + Math.random() * 0.2; // Blue to purple range
            const saturation = 0.5 + Math.random() * 0.5;
            const lightness = 0.5 + Math.random() * 0.5;
            
            color.setHSL(hue, saturation, lightness);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Sizes
            sizes[i] = Math.random() * 3 + 1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Add gentle floating animation
                    mvPosition.y += sin(time * 0.001 + position.x * 0.01) * 10.0;
                    mvPosition.x += cos(time * 0.0015 + position.y * 0.01) * 5.0;
                    
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFloatingGeometries() {
        this.geometries = [];
        const geometryTypes = [
            new THREE.TetrahedronGeometry(20, 0),
            new THREE.OctahedronGeometry(15, 0),
            new THREE.IcosahedronGeometry(18, 0)
        ];

        for (let i = 0; i < 8; i++) {
            const geometry = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.7, 0.6),
                transparent: true,
                opacity: 0.1,
                wireframe: true
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 500
            );
            
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            mesh.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                }
            };

            this.geometries.push(mesh);
            this.scene.add(mesh);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now();

        // Update particle system
        if (this.particles && this.particles.material.uniforms) {
            this.particles.material.uniforms.time.value = time;
            this.particles.rotation.y += 0.0005;
        }

        // Update floating geometries
        this.geometries.forEach(geometry => {
            geometry.rotation.x += geometry.userData.rotationSpeed.x;
            geometry.rotation.y += geometry.userData.rotationSpeed.y;
            geometry.rotation.z += geometry.userData.rotationSpeed.z;
            
            // Gentle floating motion
            geometry.position.y += Math.sin(time * 0.001 + geometry.position.x * 0.01) * 0.1;
        });

        // Mouse interaction
        this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX - this.windowHalf.x) * 0.1;
            this.mouse.y = (event.clientY - this.windowHalf.y) * 0.1;
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.windowHalf.x = window.innerWidth / 2;
            this.windowHalf.y = window.innerHeight / 2;
            
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
}

// Smooth Scrolling and Animations
class SmoothAnimations {
    constructor() {
        this.setupScrollAnimations();
        this.setupButtonAnimations();
        this.setupIntersectionObserver();
    }

    setupScrollAnimations() {
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }

    setupButtonAnimations() {
        // CTA button ripple effect
        const ctaButton = document.getElementById('ctaButton');
        if (ctaButton) {
            ctaButton.addEventListener('click', (e) => {
                const ripple = ctaButton.querySelector('.cta-ripple');
                ripple.style.width = '0';
                ripple.style.height = '0';
                
                setTimeout(() => {
                    ripple.style.width = '300px';
                    ripple.style.height = '300px';
                }, 10);
                
                setTimeout(() => {
                    ripple.style.width = '0';
                    ripple.style.height = '0';
                }, 600);
            });
        }
    }

    setupIntersectionObserver() {
        // Animate elements when they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe feature cards
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(card);
        });
    }
}

// Performance Optimization
class PerformanceOptimizer {
    constructor() {
        this.setupLazyLoading();
        this.optimizeAnimations();
    }

    setupLazyLoading() {
        // Preload critical resources
        const criticalResources = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = 'style';
            document.head.appendChild(link);
        });
    }

    optimizeAnimations() {
        // Reduce animations on low-performance devices
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.documentElement.style.setProperty('--transition', 'all 0.2s ease');
            document.documentElement.style.setProperty('--transition-fast', 'all 0.1s ease');
        }

        // Pause animations when tab is not visible
        document.addEventListener('visibilitychange', () => {
            const canvas = document.getElementById('three-canvas');
            if (canvas) {
                canvas.style.animationPlayState = document.hidden ? 'paused' : 'running';
            }
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Three.js background
    new ThreeJSBackground();
    
    // Initialize smooth animations
    new SmoothAnimations();
    
    // Initialize performance optimizations
    new PerformanceOptimizer();
    
    // Add loading complete class for any additional animations
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause heavy animations when tab is not visible
        document.body.classList.add('paused');
    } else {
        document.body.classList.remove('paused');
    }
});