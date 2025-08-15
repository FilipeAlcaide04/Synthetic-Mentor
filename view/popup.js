import { marked } from '../libs/marked.esm.js'; 
import { generateSummary, generateChatResponse } from '../call_gemini.js';

document.addEventListener('DOMContentLoaded', () => {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const loading = document.getElementById('loading');
  const summaryChatContainer = document.getElementById('summaryChatContainer');
  const summaryContent = document.getElementById('summaryContent');
  const chatMessages = document.getElementById('chatMessages');
  const userMessage = document.getElementById('userMessage');
  const sendMessage = document.getElementById('sendMessage');
  const copySummary = document.getElementById('copySummary');

  summarizeBtn.addEventListener('click', async () => {
    showLoading();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageContent
      });

      const pageContent = results[0].result || "No content found.";
      const summary = await generateSummary(pageContent);

      summaryContent.innerHTML = marked.parse(summary);

      await chrome.storage.local.set({ pageContext: pageContent });

      hideLoading();
      summaryChatContainer.classList.remove('hidden');

      chatMessages.innerHTML = '';
      addBotMessage("Olá! Posso responder perguntas sobre este site. Pergunte algo ou clique no resumo acima.");
    } catch (err) {
      console.error(err);
      summaryContent.innerHTML = '<p>Erro ao gerar resumo. Por favor, tente novamente.</p>';
      hideLoading();
      summaryChatContainer.classList.remove('hidden');
    }
  });

  copySummary.addEventListener('click', () => {
    navigator.clipboard.writeText(summaryContent.textContent).then(() => {
      const original = copySummary.innerHTML;
      copySummary.innerHTML = '<i class="fas fa-check"></i> Copiado!';
      setTimeout(() => copySummary.innerHTML = original, 2000);
    });
  });

  sendMessage.addEventListener('click', sendChatMessage);
  userMessage.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessage(); });

  async function sendChatMessage() {
    const message = userMessage.value.trim();
    if (!message) return;
    addUserMessage(message);
    userMessage.value = '';
    showChatLoading();

    try {
      const { pageContext } = await chrome.storage.local.get('pageContext');
      const response = await generateChatResponse(message, pageContext || "No context.");
      addBotMessage(response);
    } catch (err) {
      console.error(err);
      addBotMessage("Erro ao processar sua mensagem.");
    } finally {
      hideChatLoading();
    }
  }

  // Helper functions
  function showLoading() { loading.classList.remove('hidden'); summaryChatContainer.classList.add('hidden'); }
  function hideLoading() { loading.classList.add('hidden'); }

  function showChatLoading() {
    const spinner = document.createElement('div');
    spinner.className = 'chat-message bot-message';
    spinner.innerHTML = '<div class="spinner small"></div>';
    chatMessages.appendChild(spinner);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideChatLoading() {
    chatMessages.querySelectorAll('.spinner.small').forEach(el => el.parentElement.remove());
  }

  function addUserMessage(text) {
    const el = document.createElement('div');
    el.className = 'chat-message user-message';
    el.innerHTML = `<div>${text}</div><div class="message-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

function addBotMessage(text) {
  const el = document.createElement('div');
  el.className = 'chat-message bot-message';
  // Render Markdown for the bot message
  el.innerHTML = marked.parse(text) + `<div class="message-time">${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


  function extractPageContent() {
    const mainContent = document.querySelector('main, article, .main-content') || document.body;
    return mainContent.innerText.replace(/\s+/g, ' ').trim().substring(0, 10000);
  }
});
