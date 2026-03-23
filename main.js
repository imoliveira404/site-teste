document.addEventListener('DOMContentLoaded', () => {
    // Scroll indicator functionality
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const categoriesSection = document.querySelector('.categories');
            if (categoriesSection) {
                categoriesSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Add simple hover effect on cards relative to mouse position
    const cards = document.querySelectorAll('.category-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Add the CSS for the mouse glow effect dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .category-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
                600px circle at var(--mouse-x, 0) var(--mouse-y, 0), 
                rgba(67, 208, 71, 0.05),
                transparent 40%
            );
            z-index: 10;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .category-card:hover::after {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // FAQ Accordion Functionality
    const faqCards = document.querySelectorAll('.faq-card');
    
    faqCards.forEach(card => {
        card.addEventListener('click', () => {
            const answer = card.querySelector('.faq-answer');
            const isActive = card.classList.contains('active');
            
            // Close all other open cards
            faqCards.forEach(c => {
                c.classList.remove('active');
                if (c.querySelector('.faq-answer')) {
                    c.querySelector('.faq-answer').style.maxHeight = null;
                }
            });
            
            // Toggle current card
            if (!isActive) {
                card.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Copy IP functionality
    const serverIpBox = document.querySelector('.hero-ip-box');
    if (serverIpBox) {
        serverIpBox.addEventListener('click', () => {
            const ip = "jogar.auroramc.com.br";
            navigator.clipboard.writeText(ip).then(() => {
                serverIpBox.classList.add('copied');
                
                // Add mini animation or sound effects if desired
                setTimeout(() => {
                    serverIpBox.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar IP: ', err);
            });
        });
    }

    console.log("Loja AuroraMC carregada com sucesso!");
});
