// Ajustes do convite. Os valores VITE_* vêm do arquivo .env (veja .env.example).
export const CONFIG = {
  // até quantos meses à frente dá para marcar
  monthsAhead: Number(import.meta.env.VITE_MONTHS_AHEAD) || 4,

  // servidor local (`npm run dev` / `npm run preview`) que grava em responses.txt
  saveEndpoint: '/save',

  // Cloudflare Worker (ou outro backend) para quando o site está hospedado.
  // Vazio = a resposta é entregue como arquivo .txt no aparelho de quem respondeu.
  remoteEndpoint: import.meta.env.VITE_SAVE_ENDPOINT || '',

  fileName: 'detalhes-do-date.txt',

  // opcional: seu e-mail, para mostrar o link "enviar por e-mail" na tela final
  sendTo: import.meta.env.VITE_SEND_TO || '',

  // opcional: SEU número de WhatsApp (DDI + DDD + número; símbolos são ignorados).
  // Mostra o botão "Avisar no WhatsApp" na tela final: abre o WhatsApp dela com a
  // resposta já escrita, para o seu número. Ela só precisa tocar em Enviar.
  whatsapp: (import.meta.env.VITE_WHATSAPP || '').replace(/\D/g, ''),
};

// Opções da tela "E pra comer?" (troque, apague ou acrescente à vontade)
export const FOODS = [
  { id: 'pizza', emoji: '🍕', label: 'Pizza' },
  { id: 'sushi', emoji: '🍣', label: 'Sushi' },
  { id: 'cachorro-quente', emoji: '🌭', label: 'Cachorro-quente' },
  { id: 'lanche', emoji: '🍔', label: 'Lanche' },
  { id: 'carne', emoji: '🥩', label: 'Carne' },
  { id: 'italiano', emoji: '🍝', label: 'Italiano' },
  { id: 'japones-quente', emoji: '🍜', label: 'Japonês quente' },
  { id: 'doce-e-cafe', emoji: '🍰', label: 'Doce e café' },
];

// Frases que aparecem cada vez que o botão "Não" escapa
export const TAUNTS = [
  'boa tentativa 😌',
  'hm... ele se mexeu 👀',
  'esse botão é tímido 🙈',
  'você não vai pegar tão fácil 😏',
  'o Não é puramente decorativo 💅',
  'ainda quer o Não? experimenta o rosa 💕',
  'o botão diz: de jeito nenhum 😂',
  'ihhh, passou perto! 🤏',
  'quase! só que não 😜',
  'o destino está tentando te dizer algo 👀',
  'negativo! literalmente 😭',
  'esse clique não foi autorizado 🚫',
  'calma, respira e escolhe o Sim 😌',
  'você está insistindo no botão errado 🤨',
  'o Não entrou em modo de fuga 🏃‍♂️',
  'nem o botão quer te dizer não 😂',
  'mais uma tentativa? que persistência 👏',
  'será que o Sim está chamando? 💖',
  'o Não está indisponível no momento 📵',
  'ih, fugiu de novo! 😂',
  'o amor venceu o clique 💘',
  'essa opção não está no nosso roteiro 🎬',
  'o Não pediu demissão 🏃',
  'desiste do Não e vem ser feliz 🥹💕',
  'o universo conspira pelo Sim ✨',
  'você contra o botão: rodada infinita 🎮',
  'o Não está brincando de esconde-esconde 🙈',
  'spoiler: você vai acabar clicando no Sim 😏',
  'essa é sua deixa para dizer Sim 💗',
  'última chance... brincadeira, tenta de novo 😂',
];
