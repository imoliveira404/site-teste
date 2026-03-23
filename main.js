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

    // Support Form & Modal Logic
    const initSupportForm = () => {
        // Create modal structure
        const modalHtml = `
            <div class="modal-overlay" id="support-modal-overlay">
                <div class="support-modal">
                    <button class="modal-close" id="close-support">&times;</button>
                    <div class="modal-header">
                        <h2>Central de Suporte</h2>
                        <p>Preencha os dados abaixo para falar conosco.</p>
                    </div>
                    <form class="support-form" id="support-form">
                        <div class="form-group">
                            <label for="sup-name">Seu Nome</label>
                            <input type="text" id="sup-name" placeholder="Ex: João Silva" required>
                        </div>
                        <div class="form-group">
                            <label for="sup-email">Seu E-mail</label>
                            <input type="email" id="sup-email" placeholder="email@exemplo.com" required>
                        </div>
                        <div class="form-group">
                            <label for="sup-nick">Nick no Jogo</label>
                            <input type="text" id="sup-nick" placeholder="Ex: Player123" required>
                        </div>
                        <div class="form-group">
                            <label for="sup-reason">Motivo do Contato</label>
                            <select id="sup-reason" required>
                                <option value="" disabled selected>Selecione um motivo...</option>
                                <option value="Problemas com Compras">Problemas com Compras</option>
                                <option value="Dúvidas Gerais">Dúvidas Gerais</option>
                                <option value="Reportar Bug">Reportar Bug</option>
                                <option value="Apelação de Punição">Apelação de Punição</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="sup-message">Mensagem</label>
                            <textarea id="sup-message" rows="4" placeholder="Como podemos te ajudar?" required></textarea>
                        </div>
                        <button type="submit" class="btn-submit" id="submit-support">
                            <i class="fa-solid fa-paper-plane"></i> Enviar Mensagem
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const overlay = document.getElementById('support-modal-overlay');
        const openBtn = document.getElementById('open-support');
        const closeBtn = document.getElementById('close-support');
        const form = document.getElementById('support-form');
        const submitBtn = document.getElementById('submit-support');

        if (!openBtn) return;

        openBtn.addEventListener('click', () => {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeModal = () => {
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('sup-name').value;
            const email = document.getElementById('sup-email').value;
            const nick = document.getElementById('sup-nick').value;
            const reason = document.getElementById('sup-reason').value;
            const message = document.getElementById('sup-message').value;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

            const webhookUrl = 'https://discord.com/api/webhooks/1485713362720391270/w9re4Cg2uP4d1WeTREZZpfFiBeBhoiB9LjlxcEULPsHKXu0KGD1UTbQCV4eN9Uy3fHHr';

            const payload = {
                username: "AuroraMC Suporte",
                avatar_url: "https://auroramc.net/images/logo.png",
                embeds: [{
                    title: "🎫 Novo Ticket de Suporte",
                    color: 4443463, // var(--primary) equivalent
                    fields: [
                        { name: "👤 Nome", value: name, inline: true },
                        { name: "📧 E-mail", value: email, inline: true },
                        { name: "🎮 Nick", value: nick, inline: true },
                        { name: "📋 Motivo", value: reason, inline: false },
                        { name: "💬 Mensagem", value: message, inline: false }
                    ],
                    footer: { text: "AuroraMC Store - Suporte via Webhook" },
                    timestamp: new Date().toISOString()
                }]
            };

            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Enviado com Sucesso!';
                    submitBtn.style.backgroundColor = '#43d047';
                    form.reset();
                    setTimeout(closeModal, 2000);
                } else {
                    throw new Error('Erro ao enviar');
                }
            } catch (error) {
                console.error('Erro no webhook:', error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro ao enviar. Tente novamente.';
                submitBtn.style.backgroundColor = '#ef5350';
            }
        });
    };

    // Mobile Menu Logic
    const initMobileMenu = () => {
        const menuHtml = `
            <div class="mobile-menu-bg" id="mobile-menu-bg"></div>
            <div class="mobile-menu-overlay" id="mobile-menu-overlay">
                <a href="index.html" class="mobile-menu-link"><i class="fa-solid fa-house"></i> Início</a>
                <a href="categoria-vips.html" class="mobile-menu-link"><i class="fa-solid fa-crown"></i> VIPs</a>
                <a href="termos.html" class="mobile-menu-link"><i class="fa-solid fa-file-contract"></i> Termos</a>
                <div class="mobile-menu-link" id="mobile-support-btn" style="cursor: pointer;"><i class="fa-solid fa-headset"></i> Suporte</div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuHtml);

        const bg = document.getElementById('mobile-menu-bg');
        const overlay = document.getElementById('mobile-menu-overlay');
        const toggles = document.querySelectorAll('.menu-toggle');
        const supportBtnInMenu = document.getElementById('mobile-support-btn');

        const toggleMenu = () => {
            bg.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = bg.classList.contains('active') ? 'hidden' : '';
        };

        toggles.forEach(btn => btn.addEventListener('click', toggleMenu));
        bg.addEventListener('click', toggleMenu);

        // Close and open support from menu
        if (supportBtnInMenu) {
            supportBtnInMenu.addEventListener('click', () => {
                toggleMenu();
                setTimeout(() => {
                    document.getElementById('open-support').click();
                }, 300);
            });
        }
    };

    initSupportForm();
    initMobileMenu();

    console.log("Loja AuroraMC carregada com sucesso!");
});
