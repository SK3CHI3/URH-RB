document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        if (body.classList.contains('light-theme')) {
            themeToggle.querySelector('i').classList.remove('fa-sun');
            themeToggle.querySelector('i').classList.add('fa-moon');
        } else {
            themeToggle.querySelector('i').classList.remove('fa-moon');
            themeToggle.querySelector('i').classList.add('fa-sun');
        }
    });

    // Micro animations on scroll with Intersection Observer
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.category-card, .resource-card, .hero h1, .hero p, .search-container');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        elements.forEach(element => {
            observer.observe(element);
            // Set initial state
            element.classList.add('animate-ready');
        });
    };
    
    // Call the animation function
    animateOnScroll();

    // Add animation to buttons for better feedback
    const addButtonAnimations = () => {
        const buttons = document.querySelectorAll('button, .filter-btn, .tag');
        
        buttons.forEach(button => {
            button.addEventListener('mousedown', () => {
                button.classList.add('button-press');
            });
            
            button.addEventListener('mouseup', () => {
                button.classList.remove('button-press');
            });
            
            button.addEventListener('mouseleave', () => {
                button.classList.remove('button-press');
            });
        });
    };
    
    addButtonAnimations();

    // Smooth page transitions when clicking navigation links
    const pageLinks = document.querySelectorAll('nav a, .logo a, .category-card a, .resource-card a');
    
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Only intercept links to pages within our site
            const href = link.getAttribute('href');
            
            if (href && (href.startsWith('/') || href.startsWith('./') || href.startsWith('#'))) {
                e.preventDefault();
                
                // Create flash animation
                const flash = document.createElement('div');
                flash.classList.add('page-transition');
                document.body.appendChild(flash);
                
                // After animation completes, navigate to the page
                setTimeout(() => {
                    window.location.href = href;
                }, 500);
            }
        });
    });

    // Highlight navigation link based on scroll position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    const highlightNavLink = () => {
        let index = sections.length;

        while(--index && window.scrollY + 50 < sections[index].offsetTop) {}

        navLinks.forEach((link) => link.classList.remove('active'));
        navLinks[index].classList.add('active');
    };

    highlightNavLink();
    window.addEventListener('scroll', highlightNavLink);

    // Category filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // In a real application, we would filter resources here
            console.log('Filter by:', button.textContent.trim());
        });
    });

    // View toggle (grid/list)
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const resourcesGrid = document.querySelector('.resources-grid');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Toggle grid/list view
            if (button.querySelector('i').classList.contains('fa-list')) {
                resourcesGrid.classList.add('list-view');
            } else {
                resourcesGrid.classList.remove('list-view');
            }
        });
    });

    // Sort dropdown (would connect to backend in real application)
    const sortBtn = document.querySelector('.sort-btn');
    sortBtn.addEventListener('click', () => {
        console.log('Sort dropdown clicked');
        // In a real application, this would open a dropdown menu
    });

    // Search functionality
    const searchInput = document.querySelector('.search-container input');
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            console.log('Search for:', searchInput.value);
            // In a real application, this would trigger a search
        }
    });
}); 