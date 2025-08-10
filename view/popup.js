document.addEventListener('DOMContentLoaded', function() {
  // Elementos da UI
  const summariseBtn = document.getElementById('summarizeBtn');
  const chatBtn = document.getElementById('chatBtn');
  const loading = document.getElementById('loading');
  const summaryContainer = document.getElementById('summaryContainer');
  const chatContainer = document.getElementById('chatContainer');
  const summaryContent = document.getElementById('summaryContent');
  const copySummary = document.getElementById('copySummary');
  const chatMessages = document.getElementById('chatMessages');
  const userMessage = document.getElementById('userMessage');
  const sendMessage = document.getElementById('sendMessage');

  // Mostrar seção de resumo
  summariseBtn.addEventListener('click', async function() {
    showLoading();
    
    try {
      // Obter a aba ativa
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Executar script para extrair conteúdo da página
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent
      });
      
      const pageContent = results[0].result;
      
      // Chamar API de resumo (simulado - você precisará implementar)
      const summary = await generateSummary(pageContent);
      
      summaryContent.innerHTML = summary;
      hideLoading();
      summaryContainer.classList.remove('hidden');
      chatContainer.classList.add('hidden');
    } catch (error) {
      console.error('Error:', error);
      summaryContent.innerHTML = '<p>Erro ao gerar resumo. Por favor, tente novamente.</p>';
      hideLoading();
      summaryContainer.classList.remove('hidden');
    }
  });

  // Mostrar seção de chat
  chatBtn.addEventListener('click', async function() {
    showLoading();
    
    try {
      // Obter contexto da página para o chat
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent
      });
      
      // Armazenar contexto para uso no chat
      await chrome.storage.local.set({ pageContext: results[0].result });
      
      // Limpar mensagens anteriores e mostrar interface de chat
      chatMessages.innerHTML = '';
      addBotMessage("Olá! Posso responder perguntas sobre este site. O que você gostaria de saber?");
      
      hideLoading();
      chatContainer.classList.remove('hidden');
      summaryContainer.classList.add('hidden');
    } catch (error) {
      console.error('Error:', error);
      hideLoading();
      addBotMessage("Não consegui acessar o conteúdo desta página. Você ainda pode fazer perguntas gerais.");
      chatContainer.classList.remove('hidden');
      summaryContainer.classList.add('hidden');
    }
  });

  // Copiar resumo
  copySummary.addEventListener('click', function() {
    navigator.clipboard.writeText(summaryContent.textContent)
      .then(() => {
        const originalText = copySummary.innerHTML;
        copySummary.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        setTimeout(() => {
          copySummary.innerHTML = originalText;
        }, 2000);
      });
  });

  // Enviar mensagem no chat
  sendMessage.addEventListener('click', sendChatMessage);
  userMessage.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendChatMessage();
  });

  async function sendChatMessage() {
    const message = userMessage.value.trim();
    if (!message) return;
    
    addUserMessage(message);
    userMessage.value = '';
    
    showChatLoading();
    
    try {
      // Obter contexto da página
      const { pageContext } = await chrome.storage.local.get('pageContext');
      
      // Chamar API de chat (simulado - você precisará implementar)
      const response = await generateChatResponse(message, pageContext);
      
      addBotMessage(response);
    } catch (error) {
      console.error('Error:', error);
      addBotMessage("Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.");
    } finally {
      hideChatLoading();
    }
  }

  // Funções auxiliares
  function showLoading() {
    loading.classList.remove('hidden');
    summaryContainer.classList.add('hidden');
    chatContainer.classList.add('hidden');
  }

  function hideLoading() {
    loading.classList.add('hidden');
  }

  function showChatLoading() {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'chat-message bot-message';
    loadingElement.innerHTML = '<div class="spinner small"></div>';
    chatMessages.appendChild(loadingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideChatLoading() {
    const loadingElements = chatMessages.querySelectorAll('.spinner.small');
    loadingElements.forEach(el => el.parentElement.remove());
  }

  function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message user-message';
    messageElement.innerHTML = `
      <div>${text}</div>
      <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addBotMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message bot-message';
    messageElement.innerHTML = `
      <div>${text}</div>
      <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Função para extrair conteúdo da página (executada no contexto da página)
  function extractPageContent() {
    // Simplificado - você pode melhorar esta função
    const mainContent = document.querySelector('main, article, .main-content') || document.body;
    return mainContent.innerText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limitar tamanho para evitar problemas
  }

  // Funções simuladas para chamadas de API (substitua por implementações reais)
  async function generateSummary(text) {
    // Simulação - na prática, você chamaria sua API de IA aqui
    return new Promise(resolve => {
      setTimeout(() => {
        const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
        const summary = sentences.slice(0, 5).join(' ');
        resolve(summary || "Este site parece ter pouco conteúdo textual para resumir.");
      }, 1500);
    });
  }

  async function generateChatResponse(message, context) {
    // Simulação - na prática, você chamaria sua API de IA aqui
    return new Promise(resolve => {
      setTimeout(() => {
        if (message.toLowerCase().includes('resum')) {
          resolve("Com base no conteúdo do site, aqui está um resumo: " + 
            context.substring(0, 200) + "...");
        } else {
          resolve("Você perguntou sobre: " + message + 
            "\n\nInfelizmente, esta é apenas uma simulação. " +
            "Na implementação real, eu analisaria o conteúdo do site para responder.");
        }
      }, 2000);
    });
  }
});