import { api } from './api.js'

// O código dos slides vem do próprio servidor em C, entre "// [slide:nome]" e "// [/slide]".
const fontes = { 'arvore.c': '', 'avl.c': '', 'arvore.h': '' }

export async function carregarFontes() {
  await Promise.all(
    Object.keys(fontes).map(async (arquivo) => {
      try {
        fontes[arquivo] = (await api.fonte(arquivo)).replace(/\r/g, '')
      } catch {
        fontes[arquivo] = ''
      }
    }),
  )
}

const INDISPONIVEL = '/* código indisponível: o servidor em C está fora do ar */'

export function trecho(nome) {
  const re = new RegExp(`//\\s*\\[slide:${nome}\\][^\\n]*\\n([\\s\\S]*?)//\\s*\\[/slide\\]`)
  for (const arquivo of ['arvore.c', 'avl.c']) {
    const m = fontes[arquivo].match(re)
    if (m) return { arquivo, codigo: m[1].replace(/\s+$/, '') }
  }
  return { arquivo: 'servidor', codigo: INDISPONIVEL }
}

export function estrutura() {
  const m = fontes['arvore.h'].match(/typedef struct No \{[\s\S]*?\} No;/)
  return m ? m[0] : INDISPONIVEL
}

const PALAVRAS = new Set([
  'if', 'else', 'return', 'while', 'for', 'do', 'break', 'continue',
  'struct', 'typedef', 'sizeof', 'void', 'int', 'char', 'long', 'const', 'static',
])
const ESPECIAIS = new Set(['NULL', 'No', 'malloc', 'free', 'printf', 'exit'])

const TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*")|(#\w+)|\b(\d+)\b|\b([A-Za-z_]\w*)\b(?=\s*\()|\b([A-Za-z_]\w*)\b/g

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function realcar(codigo) {
  let html = ''
  let ultimo = 0
  for (const m of codigo.matchAll(TOKEN)) {
    html += esc(codigo.slice(ultimo, m.index))
    const [txt, com, str, pre, num, func, ident] = m
    if (com) html += `<span class="c-com">${esc(com)}</span>`
    else if (str) html += `<span class="c-str">${esc(str)}</span>`
    else if (pre) html += `<span class="c-pre">${esc(pre)}</span>`
    else if (num) html += `<span class="c-num">${num}</span>`
    else if (func) {
      const cls = ESPECIAIS.has(func) ? 'c-mem' : PALAVRAS.has(func) ? 'c-kw' : 'c-fn'
      html += `<span class="${cls}">${func}</span>`
    } else if (PALAVRAS.has(ident)) html += `<span class="c-kw">${ident}</span>`
    else if (ESPECIAIS.has(ident)) html += `<span class="c-tipo">${ident}</span>`
    else html += esc(txt)
    ultimo = m.index + txt.length
  }
  return html + esc(codigo.slice(ultimo))
}

export function blocoCodigo(codigo) {
  const linhas = realcar(codigo).split('\n')
  const cruas = codigo.split('\n')
  return `<pre class="codigo"><code>${linhas
    .map((l, i) => {
      const mem = /\b(malloc|free)\s*\(/.test(cruas[i]) ? ' mem' : ''
      return `<span class="linha${mem}"><span class="n">${i + 1}</span>${l || ' '}</span>`
    })
    .join('')}</code></pre>`
}
