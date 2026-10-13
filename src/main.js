import './style.css'
import { api, definirTipoArvore, ErroApi } from './api.js'
import { carregarFontes } from './codigo.js'
import { TreeView } from './tree-view.js'
import { TIPOS, abrirSlide, configurarSlides, definirTipoSlides, operacoes } from './slides.js'

const $ = (sel) => document.querySelector(sel)
const view = new TreeView($('#arvore'))
const EXEMPLO = [50, 30, 70, 20, 40, 60, 80, 35, 45, 65]
const CRESCENTE = [10, 20, 30, 40, 50, 60, 70, 80]

let tipoArvore = localStorage.getItem('tipoArvore') === 'avl' ? 'avl' : 'bst'
let ocupado = false
let online = false
let arvoreAtual = null

const velocidade = () => Number($('#velocidade').value)
const espera = (ms) => new Promise((r) => setTimeout(r, ms / velocidade()))

function log(html, tipo = '') {
  const li = document.createElement('li')
  li.className = tipo
  li.innerHTML = html
  $('#log').append(li)
  li.scrollIntoView({ block: 'nearest' })
}

function sequencia(valores = [], rotulo = '') {
  $('#sequencia').innerHTML =
    (rotulo ? `<span class="seq-rotulo">${rotulo}</span>` : '') +
    valores.map((v) => `<span class="chip">${v}</span>`).join('')
}

function adicionarChip(v) {
  const chip = document.createElement('span')
  chip.className = 'chip novo'
  chip.textContent = v
  $('#sequencia').append(chip)
}

function atualizarStats(r) {
  arvoreAtual = r.arvore
  $('#stat-total').textContent = r.total
  $('#stat-altura').textContent = r.altura
  $('#aviso-espelho').hidden = !r.espelhada
}

async function sincronizarVista(r) {
  if (JSON.stringify(r.arvore) !== JSON.stringify(arvoreAtual)) {
    log('A árvore no servidor mudou (outra aba?) - redesenhando.', 'aviso')
    await view.atualizar(r.arvore)
  }
  atualizarStats(r)
}

function filhosDe(arvore) {
  const mapa = new Map()
  const visitar = (no) => {
    if (!no) return
    mapa.set(no.v, [no.e?.v, no.d?.v].filter((v) => v !== undefined))
    visitar(no.e)
    visitar(no.d)
  }
  visitar(arvore)
  return mapa
}

function alturaJson(no) {
  return no ? 1 + Math.max(alturaJson(no.e), alturaJson(no.d)) : 0
}

function caminhoMaisLongo(no) {
  if (!no) return []
  const e = caminhoMaisLongo(no.e)
  const d = caminhoMaisLongo(no.d)
  return [no.v, ...(e.length >= d.length ? e : d)]
}

const fatorJson = (no) => alturaJson(no.e) - alturaJson(no.d)

function desbalanceados(no, saida = []) {
  if (!no) return saida
  const fb = fatorJson(no)
  if (Math.abs(fb) > 1) saida.push(no)
  desbalanceados(no.e, saida)
  desbalanceados(no.d, saida)
  return saida
}

// Inserção e remoção de BST simples, usadas para mostrar a AVL antes das rotações.
function inserirJson(no, v) {
  if (!no) return { v, e: null, d: null }
  if (v < no.v) return { ...no, e: inserirJson(no.e, v) }
  if (v > no.v) return { ...no, d: inserirJson(no.d, v) }
  return no
}

function removerJson(no, v) {
  if (!no) return null
  if (v < no.v) return { ...no, e: removerJson(no.e, v) }
  if (v > no.v) return { ...no, d: removerJson(no.d, v) }
  if (!no.e) return no.d
  if (!no.d) return no.e
  let sucessor = no.d
  while (sucessor.e) sucessor = sucessor.e
  return { ...no, v: sucessor.v, d: removerJson(no.d, sucessor.v) }
}

function descreverRotacao(no) {
  const fb = fatorJson(no)
  if (fb > 1) return fatorJson(no.e) < 0 ? 'rotação dupla esquerda-direita (LR)' : 'rotação simples à direita'
  return fatorJson(no.d) > 0 ? 'rotação dupla direita-esquerda (RL)' : 'rotação simples à esquerda'
}

// Mostra a árvore desbalanceada, destaca o nó com fator +2/-2 e então aplica o resultado do C.
async function rebalancearNaTela(intermediaria, r) {
  await view.atualizar(intermediaria)
  const ruins = desbalanceados(intermediaria)
  const no = ruins[ruins.length - 1]
  if (no) {
    view.marcar(no.v, 'alvo')
    const fb = fatorJson(no)
    log(`O nó <b>${no.v}</b> ficou com fator <b>${fb > 0 ? '+' : ''}${fb}</b> → ${descreverRotacao(no)}.`, 'aviso')
    await espera(1400)
    view.limparMarcas()
  }
  await view.atualizar(r.arvore, 900)
  log(`${r.rotacoes} rotação(ões). Rotações só trocam ponteiros: nenhum <code>malloc</code>/<code>free</code>.`, 'mem')
}

function definirOnline(estado) {
  online = estado
  const s = $('#status')
  s.classList.toggle('on', estado)
  s.querySelector('span').textContent = estado ? 'backend C online' : 'backend C offline'
}

function travar(estado) {
  ocupado = estado
  document.querySelectorAll('[data-rotina] button:not(.btn-slide), [data-rotina] input, .extras button, .tipos button')
    .forEach((el) => (el.disabled = estado))
}

function lerValor(id) {
  const input = $(`#valor-${id}`)
  const txt = input.value.trim()
  if (!/^-?\d+$/.test(txt) || Math.abs(Number(txt)) > 999) {
    input.classList.add('erro')
    input.focus()
    setTimeout(() => input.classList.remove('erro'), 600)
    log('Digite um número inteiro entre -999 e 999.', 'erro')
    return null
  }
  return Number(txt)
}

async function executar(acao) {
  if (ocupado) return
  travar(true)
  view.limparMarcas()
  try {
    await acao()
    definirOnline(true)
  } catch (e) {
    if (e instanceof ErroApi) {
      log(e.message, 'erro')
      if (/fora do ar/.test(e.message)) definirOnline(false)
    } else throw e
  } finally {
    travar(false)
  }
}

async function animarCaminho(caminho, valor, classeFinal = 'caminho') {
  for (const v of caminho) {
    view.marcar(v, 'atual')
    if (valor === v) log(`<b>${valor}</b> = ${v} → encontrado`)
    else log(`<b>${valor}</b> ${valor < v ? '&lt;' : '&gt;'} ${v} → vai para a <b>${valor < v ? 'esquerda' : 'direita'}</b>`, 'passo')
    await espera(520)
    view.marcar(v, classeFinal)
  }
}

const acoes = {
  async inserir() {
    const valor = lerValor('inserir')
    if (valor === null) return
    const r = await api.inserir(valor)
    log(`<span class="tag">inserir(${valor})</span>`, 'titulo')
    await animarCaminho(r.caminho, valor)
    if (!r.ok) {
      view.marcar(valor, 'falhou')
      log(`${valor} já existe - a árvore não aceita valores repetidos.`, 'aviso')
      return
    }
    log(`Achou <code>NULL</code> → <code>malloc(sizeof(No))</code> cria o nó ${valor}`, 'mem')
    if (r.rotacoes > 0) await rebalancearNaTela(inserirJson(arvoreAtual, valor), r)
    else await view.atualizar(r.arvore)
    view.marcar(valor, 'novo')
    atualizarStats(r)
    $('#valor-inserir').select()
  },

  async buscar() {
    const valor = lerValor('buscar')
    if (valor === null) return
    const r = await api.buscar(valor)
    await sincronizarVista(r)
    log(`<span class="tag">buscar(${valor})</span>`, 'titulo')
    await animarCaminho(r.caminho, valor)
    if (r.encontrado) {
      view.marcar(valor, 'achado')
      log(`Encontrado em ${r.caminho.length} comparação(ões).`, 'ok')
    } else {
      log(`Chegou em <code>NULL</code> → ${valor} não está na árvore (retorna NULL).`, 'aviso')
    }
  },

  async remover() {
    const valor = lerValor('remover')
    if (valor === null) return
    const r = await api.remover(valor)
    log(`<span class="tag">remover(${valor})</span>`, 'titulo')
    await animarCaminho(r.caminho, valor)
    if (!r.ok) {
      log(`${valor} não existe - nada a remover.`, 'aviso')
      return
    }
    view.marcar(valor, 'alvo')
    if (r.caso === 'folha') {
      log('Caso 1 - <b>folha</b>: <code>free()</code> e o pai passa a apontar para NULL.', 'mem')
    } else if (r.caso === 'um_filho') {
      log('Caso 2 - <b>um filho</b>: o filho sobe e o nó recebe <code>free()</code>.', 'mem')
    } else {
      log(`Caso 3 - <b>dois filhos</b>: procura o sucessor (menor valor à direita)...`)
      for (const v of r.caminhoSucessor) {
        view.marcar(v, 'atual')
        await espera(420)
        view.marcar(v, 'caminho')
      }
      view.marcar(r.sucessor, 'sucessor')
      log(`Sucessor = <b>${r.sucessor}</b>: copia o valor para o lugar de ${valor} e dá <code>free()</code> no nó antigo.`, 'mem')
    }
    await espera(700)
    if (r.rotacoes > 0) {
      await rebalancearNaTela(removerJson(arvoreAtual, valor), r)
    } else {
      await view.atualizar(r.arvore)
      if (r.sucessor !== null) view.marcar(r.sucessor, 'sucessor')
    }
    atualizarStats(r)
  },

  async percorrer(tipo) {
    const r = await api.percorrer(tipo)
    await sincronizarVista(r)
    const nome = { pre: 'Pré-ordem', em: 'Em-ordem', pos: 'Pós-ordem' }[tipo]
    log(`<span class="tag">${tipo}Ordem()</span>`, 'titulo')
    if (r.sequencia.length === 0) {
      log('Árvore vazia: nada a percorrer.', 'aviso')
      sequencia()
      return
    }
    sequencia([], nome)
    for (const [i, v] of r.sequencia.entries()) {
      view.marcar(v, 'atual')
      await espera(380)
      view.marcar(v, 'visitado')
      view.selo(v, i + 1)
      adicionarChip(v)
    }
    log(`${nome}: ${r.sequencia.join(' → ')}`, 'ok')
    if (tipo === 'em') log('Repare: o percurso em-ordem sai <b>ordenado</b>!', 'passo')
  },

  async liberar() {
    const r = await api.liberar()
    log(`<span class="tag">liberarArvore()</span>`, 'titulo')
    if (r.liberados === 0) {
      log('Árvore já está vazia.', 'aviso')
      return
    }
    log('Libera em pós-ordem: filhos antes do pai.', 'passo')
    sequencia([], 'free()')
    for (const v of r.ordem) {
      view.marcar(v, 'alvo')
      adicionarChip(v)
      await espera(320)
    }
    log(`${r.liberados} nó(s) devolvidos com <code>free()</code>. raiz = NULL.`, 'mem')
    await view.atualizar(r.arvore, 700)
    atualizarStats(r)
  },

  async espelhar() {
    const r = await api.espelhar()
    log(`<span class="tag">espelhar()</span>`, 'titulo')
    if (r.total === 0) {
      log('Árvore vazia: nada a espelhar.', 'aviso')
      return
    }
    log('Em cada nó: <code>temp = esquerda; esquerda = direita; direita = temp;</code>', 'passo')
    await view.atualizar(r.arvore, 1100)
    atualizarStats(r)
    if (r.espelhada) {
      log('Agora os maiores estão à esquerda: a árvore <b>deixou de ser BST</b>. Espelhe de novo para voltar.', 'aviso')
    } else {
      log('Espelhada de novo: voltou a ser uma BST válida.', 'ok')
    }
  },

  async largura() {
    const r = await api.largura()
    await sincronizarVista(r)
    log(`<span class="tag">emLargura()</span>`, 'titulo')
    if (r.sequencia.length === 0) {
      log('Árvore vazia: nada a percorrer.', 'aviso')
      sequencia()
      return
    }
    const filhos = filhosDe(r.arvore)
    const fila = [r.sequencia[0]]
    sequencia([], 'Por nível')
    log(`enfileirar(${fila[0]}) → fila: [${fila.join(', ')}]`, 'mem')
    view.marcar(fila[0], 'caminho')
    await espera(500)
    for (const [i, v] of r.sequencia.entries()) {
      fila.shift()
      view.marcar(v, 'atual')
      const novos = filhos.get(v) ?? []
      fila.push(...novos)
      novos.forEach((f) => view.marcar(f, 'caminho'))
      log(
        `desenfileirar → visita <b>${v}</b>${novos.length ? ` · enfileirar(${novos.join(', ')})` : ''} · fila: [${fila.join(', ')}]`,
        'passo',
      )
      await espera(650)
      view.marcar(v, 'visitado')
      view.selo(v, i + 1)
      adicionarChip(v)
    }
    log(`Por nível: ${r.sequencia.join(' → ')}`, 'ok')
    log('Cada item da fila foi criado com <code>malloc</code> e liberado com <code>free</code> ao sair.', 'mem')
  },

  async estatisticas(tipo) {
    const r = await api.estatisticas()
    await sincronizarVista(r)
    if (r.total === 0) {
      log('Árvore vazia: altura 0, sem mínimo nem máximo.', 'aviso')
      return
    }
    if (tipo === 'altura') {
      log(`<span class="tag">altura()</span>`, 'titulo')
      const caminho = caminhoMaisLongo(r.arvore)
      for (const [i, v] of caminho.entries()) {
        view.marcar(v, 'atual')
        await espera(420)
        view.marcar(v, 'caminho')
        view.selo(v, i + 1)
      }
      log(`Caminho mais longo: ${caminho.join(' → ')}`, 'passo')
      log(`altura = <b>${r.altura}</b> (nós do caminho mais longo da raiz até uma folha)`, 'ok')
      return
    }
    const minimo = tipo === 'minimo'
    const caminho = minimo ? r.caminhoMinimo : r.caminhoMaximo
    const lado = minimo ? 'esquerda' : 'direita'
    log(`<span class="tag">${minimo ? 'menorNo' : 'maiorNo'}()</span>`, 'titulo')
    for (const v of caminho) {
      view.marcar(v, 'atual')
      await espera(450)
      view.marcar(v, 'caminho')
    }
    const valor = minimo ? r.minimo : r.maximo
    view.marcar(valor, 'achado')
    log(`Desce sempre pela ${lado} até ${lado} = <code>NULL</code>.`, 'passo')
    log(`${minimo ? 'Mínimo' : 'Máximo'} = <b>${valor}</b>`, 'ok')
  },
}

async function inserirCrescente() {
  log(`<span class="tag">inserir ${CRESCENTE[0]}, ${CRESCENTE[1]}, ..., ${CRESCENTE[CRESCENTE.length - 1]}</span>`, 'titulo')
  const vazia = await api.liberar()
  if (vazia.liberados) log(`Árvore anterior liberada (${vazia.liberados} nó(s)).`, 'mem')
  let r
  let rotacoes = 0
  for (const v of CRESCENTE) {
    r = await api.inserir(v)
    rotacoes += r.rotacoes
  }
  await view.atualizar(r.arvore, 800)
  atualizarStats(r)
  if (tipoArvore === 'avl') {
    log(`Mesmo inserindo em ordem crescente, a AVL fez ${rotacoes} rotações e ficou com altura ${r.altura}.`, 'ok')
  } else {
    log(`Inserindo em ordem crescente a BST vira uma "lista": altura ${r.altura}. Compare com a AVL.`, 'aviso')
  }
}

async function carregarExemplo() {
  let r
  for (const v of EXEMPLO) r = await api.inserir(v)
  log(`Exemplo carregado: inserir(${EXEMPLO.join(', ')})`, 'ok')
  await view.atualizar(r.arvore, 700)
  atualizarStats(r)
}

function controlesDe(op) {
  if (op.id === 'percorrer') {
    return `
      <div class="grupo">
        <button data-tipo="pre">Pré</button>
        <button data-tipo="em">Em</button>
        <button data-tipo="pos">Pós</button>
      </div>`
  }
  if (op.id === 'estatisticas') {
    return `
      <div class="grupo">
        <button data-tipo="altura">Altura</button>
        <button data-tipo="minimo">Mínimo</button>
        <button data-tipo="maximo">Máximo</button>
      </div>`
  }
  if (op.id === 'liberar') return `<button class="btn-perigo" data-exec>Liberar árvore</button>`
  if (op.id === 'espelhar') return `<button data-exec>Espelhar árvore</button>`
  if (op.id === 'largura') return `<button data-exec>Percorrer por nível</button>`
  return `
    <div class="campo">
      <input id="valor-${op.id}" type="text" inputmode="numeric" placeholder="valor" autocomplete="off" />
      <button data-exec>${op.titulo}</button>
    </div>`
}

function renderizarPainel() {
  const abas = Object.entries(TIPOS)
    .map(([id, t]) => `<button data-arvore="${id}" class="${id === tipoArvore ? 'on' : ''}">${id === 'bst' ? 'Binária de Busca' : 'AVL'}</button>`)
    .join('')
  const cards = operacoes()
    .map(
      (op) => `
      <article class="rotina" data-rotina="${op.id}">
        <div class="rotina-topo">
          <span class="num">${op.numero}</span>
          <div class="rotina-nome"><strong>${op.titulo}</strong></div>
          <button class="btn-slide" title="Ver slide com código e explicação">Slide</button>
        </div>
        ${controlesDe(op)}
      </article>`,
    )
    .join('')

  $('#rotinas').innerHTML = `
    <div class="tipos">${abas}</div>
    <h2>Operações</h2>
    ${cards}
    <div class="extras">
      <button class="btn-fantasma" id="btn-exemplo">Carregar exemplo</button>
      <button class="btn-fantasma" id="btn-crescente">Inserir 10 a 80 em ordem</button>
    </div>`
  $('#titulo').textContent = TIPOS[tipoArvore].nome
}

function configurarPainel() {
  $('#rotinas').addEventListener('click', (e) => {
    const aba = e.target.closest('[data-arvore]')
    if (aba) return trocarTipo(aba.dataset.arvore)
    if (e.target.closest('#btn-exemplo')) return executar(carregarExemplo)
    if (e.target.closest('#btn-crescente')) return executar(inserirCrescente)
    const card = e.target.closest('[data-rotina]')
    if (!card) return
    const id = card.dataset.rotina
    if (e.target.closest('.btn-slide')) return abrirSlide(id)
    const tipo = e.target.closest('[data-tipo]')?.dataset.tipo
    if (tipo) return executar(() => acoes[id](tipo))
    if (e.target.closest('[data-exec]')) executar(acoes[id])
  })
  $('#rotinas').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return
    const id = e.target.closest('[data-rotina]').dataset.rotina
    executar(acoes[id])
  })
}

function aplicarTipo() {
  definirTipoArvore(tipoArvore)
  definirTipoSlides(tipoArvore)
  view.mostrarFator = tipoArvore === 'avl'
  renderizarPainel()
}

async function trocarTipo(novo) {
  if (ocupado || novo === tipoArvore) return
  tipoArvore = novo
  localStorage.setItem('tipoArvore', novo)
  aplicarTipo()
  view.limparMarcas()
  sequencia()
  log(`<span class="tag">${TIPOS[novo].nome}</span>`, 'titulo')
  online = false
  await sincronizar()
}

function focarRotina(id) {
  const card = document.querySelector(`[data-rotina="${id}"]`)
  card.classList.add('destaque')
  setTimeout(() => card.classList.remove('destaque'), 1400)
  const input = card.querySelector('input')
  const padrao = { percorrer: 'em', estatisticas: 'altura' }
  if (input) input.focus()
  else executar(() => acoes[id](padrao[id]))
}

async function sincronizar() {
  try {
    const r = await api.arvore()
    if (!online) {
      definirOnline(true)
      await carregarFontes()
      await view.atualizar(r.arvore)
      atualizarStats(r)
    }
  } catch {
    if (online || $('#log').children.length === 0) {
      log(
        `Não foi possível falar com o servidor em C (<code>${import.meta.env.VITE_API_URL}</code>). ` +
          'Se ele estiver hospedado no Render, pode levar até 1 minuto para acordar.',
        'erro',
      )
    }
    definirOnline(false)
  }
}

configurarPainel()
aplicarTipo()
configurarSlides(focarRotina)
$('#btn-estrutura').addEventListener('click', () => abrirSlide('estrutura'))
$('#btn-limpar-log').addEventListener('click', () => {
  $('#log').innerHTML = ''
  sequencia()
})
sincronizar()
setInterval(() => !ocupado && !online && sincronizar(), 3000)
