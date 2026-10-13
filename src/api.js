export class ErroApi extends Error {}

// Em desenvolvimento o Vite repassa /api para VITE_API_URL; no build a URL é chamada diretamente.
const BASE_URL = import.meta.env.DEV ? '/api' : import.meta.env.VITE_API_URL

let tipoArvore = 'bst'

export function definirTipoArvore(tipo) {
  tipoArvore = tipo
}

async function chamar(rota, params = {}) {
  const query = new URLSearchParams({ ...params, arvore: tipoArvore }).toString()
  let resposta
  try {
    resposta = await fetch(`${BASE_URL}/${rota}?${query}`)
  } catch {
    throw new ErroApi(`Servidor em C fora do ar (${import.meta.env.VITE_API_URL}).`)
  }
  let corpo
  try {
    corpo = await resposta.json()
  } catch {
    throw new ErroApi(`Servidor em C fora do ar (${import.meta.env.VITE_API_URL}).`)
  }
  if (!resposta.ok) throw new ErroApi(corpo.erro ?? `Erro HTTP ${resposta.status}`)
  return corpo
}

export const api = {
  arvore: () => chamar('arvore'),
  fonte: async (arquivo) => {
    const resposta = await fetch(`${BASE_URL}/fonte?arquivo=${encodeURIComponent(arquivo)}`)
    if (!resposta.ok) throw new ErroApi(`Arquivo ${arquivo} indisponível`)
    return resposta.text()
  },
  inserir: (valor) => chamar('inserir', { valor }),
  buscar: (valor) => chamar('buscar', { valor }),
  remover: (valor) => chamar('remover', { valor }),
  percorrer: (tipo) => chamar('percorrer', { tipo }),
  liberar: () => chamar('liberar'),
  espelhar: () => chamar('espelhar'),
  largura: () => chamar('largura'),
  estatisticas: () => chamar('estatisticas'),
}
