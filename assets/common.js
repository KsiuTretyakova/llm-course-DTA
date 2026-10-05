/* ==========================================================================
   СПІЛЬНІ ДАНІ КУРСУ: назва, посилання, логотип, допоміжні функції.
   Зазвичай цей файл змінювати не потрібно.
   Відкриття і приховування занять — у файлі config.js.
   ========================================================================== */
window.COURSE = window.COURSE || {};
window.COURSE.lessons = window.COURSE.lessons || [];
var AA = function(u, t){ return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + '</a>'; };
var TRY = function(items, title){ return '<div class="try"><span class="tl">' + (title || 'Спробуйте самі') + '</span><ul>' + items.map(function(i){ return '<li>' + AA(i[0], i[1]) + (i[2] ? ': ' + i[2] : '') + '</li>'; }).join('') + '</ul></div>'; };
var LNK = {tok:'https://platform.openai.com/tokenizer', studio:'https://aistudio.google.com', gpt:'https://chatgpt.com', gem:'https://gemini.google.com', cl:'https://claude.ai', nblm:'https://notebooklm.google.com', proj:'https://projector.tensorflow.org', make:'https://www.make.com', zap:'https://zapier.com', n8n:'https://n8n.io', lora:'https://arxiv.org/abs/2106.09685', rag:'https://arxiv.org/abs/2005.11401',
  calc1:'https://www.google.com/search?q=48731*9257', calc2:'https://www.google.com/search?q=(1200*850%2B300*2400)%2F1500', calc3:'https://www.google.com/search?q=40000*0.032', calc4:'https://www.google.com/search?q=52000*0.026', calc5:'https://www.google.com/search?q=24000*0.00075', calc6:'https://www.google.com/search?q=50%2B24000*0.000015'};
var CHATS = function(what){ return [[LNK.gpt,'ChatGPT',what],[LNK.gem,'Gemini',what],[LNK.cl,'Claude',what]]; };
var CHATLINKS = AA(LNK.gpt,'ChatGPT') + ', ' + AA(LNK.gem,'Gemini') + ' або ' + AA(LNK.cl,'Claude');

var PHONE = '<div class="phone" aria-hidden="true"><div class="field">Добрий▍</div><div class="sugg"><span>день</span><span>вечір</span><span>ранок</span></div></div>';

(function(C){
C.title = 'LLM та AI-інструменти для аналітика';
C.heroTitle = 'LLM та AI-інструменти для аналітика';
C.heroText = 'Матеріали курсу простими словами. До кожного з п’яти занять — презентація і робочий зошит із завданнями. Відповіді в зошиті зберігаються в цьому браузері; зошит можна роздрукувати.';
C.scribble = '<svg class="scrib" viewBox="0 0 220 56" aria-hidden="true"><path d="M6 40 C 30 8, 52 8, 46 30 C 40 52, 70 48, 84 22 C 96 4, 120 10, 112 32 C 104 54, 140 50, 154 24 C 164 6, 190 12, 184 34 C 180 48, 200 46, 214 28" style="fill:none;stroke:var(--blue);stroke-width:9;stroke-linecap:round;stroke-linejoin:round"/></svg>';
C.services = '<h3>Корисні посилання</h3><p class="small muted" style="margin:0 0 10px">Усі сервіси безкоштовні, потрібен лише акаунт.</p><ul>'
  + '<li>' + AA(LNK.gpt,'ChatGPT') + ', ' + AA(LNK.gem,'Gemini') + ', ' + AA(LNK.cl,'Claude') + ': ШІ-чати</li>'
  + '<li>' + AA(LNK.studio,'Google AI Studio') + ': налаштування ШІ — температура, інструкції, лічильник токенів</li>'
  + '<li>' + AA(LNK.tok,'Онлайн-токенайзер OpenAI') + ': як ШІ ріже текст на токени</li>'
  + '<li>' + AA(LNK.nblm,'NotebookLM') + ': ШІ, який відповідає лише за вашими документами</li>'
  + '<li>' + AA(LNK.proj,'Embedding Projector') + ': «карта змісту» слів</li></ul>';
C.logo = {light:'assets/logo.png'};
C.totalLessons = 5;
})(window.COURSE);
