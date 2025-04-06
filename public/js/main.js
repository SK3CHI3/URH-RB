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