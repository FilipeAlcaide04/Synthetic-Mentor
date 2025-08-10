document.addEventListener('DOMContentLoaded', function() {
  // Elementos da UI
  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const backBtn = document.getElementById('backBtn');
  const thinkingIndicator = document.getElementById('thinkingIndicator');
  const suggestionBtns = document.querySelectorAll('.suggestion-btn');
  
  // Variáveis de estado
  let pageContext = '';
  let conversationHistory = [];

  // Inicialização
  initChat();

  // Event Listeners
  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });
  
  backBtn.addEventListener('click', function() {
    window.location.href = '../popup.html';
  });
  
  suggestionBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      userInput.value = this.getAttribute('data-prompt');
      userInput.focus();
    });
  });

  // Funções principais
  async function initChat() {
    // Obter a aba ativa
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Adicionar mensagem inicial
    addMessage('bot', 'Olá! Estou aqui para ajudar você a entender este site. O que você gostaria de saber?');
    
    try {
      // Extrair conteúdo da página
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent
      });
      
      pageContext = results[0].result;
      
      // Se conseguir extrair conteúdo, adiciona ao histórico
      if (pageContext) {
        conversationHistory.push({
          role: 'system',
          content: `Contexto do site: ${pageContext.substring(0, 5000)}` // Limita o tamanho
        });
      }
    } catch (error) {
      console.error('Erro ao extrair conteúdo:', error);
      addMessage('bot', 'Não consegui acessar todo o conteúdo desta página, mas ainda posso tentar ajudar!');
    }
  }

  async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Adiciona mensagem do usuário ao chat
    addMessage('user', message);
    userInput.value = '';
    
    // Mostra indicador de pensamento
    thinkingIndicator.classList.remove('hidden');
    
    try {
      // Adiciona ao histórico da conversa
      conversationHistory.push({ role: 'user', content: message });
      
      // Simula chamada à API de IA (substitua pela sua implementação real)
      const response = await generateAIResponse(conversationHistory);
      
      // Adiciona resposta ao chat e ao histórico
      addMessage('bot', response);
      conversationHistory.push({ role: 'assistant', content: response });
    } catch (error) {
      console.error('Erro:', error);
      addMessage('bot', 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.');
    } finally {
      thinkingIndicator.classList.add('hidden');
      scrollToBottom();
    }
  }

  // Funções auxiliares
  function addMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div>${text}</div>
      <div class="message-time">${timeString}</div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Função para extrair conteúdo da página (executada no contexto da página)
  function extractPageContent() {
    // Estratégia melhorada para extrair conteúdo principal
    const selectors = [
      'main', 'article', '.main-content', '.article-body',
      '#content', '#main', '.post-content'
    ];
    
    let mainContent = document.body;
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element;
        break;
      }
    }
    
    // Limpa o texto
    return mainContent.innerText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000); // Limita o tamanho
  }

  // Função simulada para gerar resposta da IA (substitua pela sua implementação real)
  async function generateAIResponse(history) {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Encontra o contexto do sistema
    const systemContext = history.find(m => m.role === 'system')?.content || '';
    
    // Última mensagem do usuário
    const lastUserMessage = history.filter(m => m.role === 'user').pop()?.content || '';
    
    // Gera resposta baseada no contexto
    if (lastUserMessage.toLowerCase().includes('resum')) {
      return `Com base no conteúdo do site, aqui está um resumo:\n\n${
        systemContext.substring(0, 500)
      }\n\n... [resumo truncado]`;
    } else if (lastUserMessage.toLowerCase().includes('princip')) {
      return `Estes parecem ser os pontos principais:\n\n1. ${
        systemContext.split('.')[0] || 'Informação 1'
      }\n2. ${
        systemContext.split('.')[1] || 'Informação 2'
      }\n3. ${
        systemContext.split('.')[2] || 'Informação 3'
      }`;
    } else {
      return `Você perguntou sobre: "${lastUserMessage}".\n\n${
        systemContext ? 'Com base no conteúdo do site, ' : ''
      }esta é uma resposta simulada. Na implementação real, eu analisaria ${
        systemContext ? 'o contexto da página' : 'seu questionamento'
      } para fornecer uma resposta mais precisa.`;
    }
  }
});