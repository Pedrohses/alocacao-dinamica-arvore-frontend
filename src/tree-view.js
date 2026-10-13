// x = posição do nó no percurso em-ordem, y = profundidade.

const R = 22
const GAP_X = 58
const GAP_Y = 86
const PAD = 52
const MIN_W = 640
const MIN_H = 380

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const lerp = (a, b, t) => a + (b - a) * t

function layout(arvore) {
  const nos = new Map()
  const fatores = new Map()
  const arestas = []
  let i = 0
  let maxProf = 0
  const visitar = (no, prof, pai) => {
    if (!no) return 0
    const he = visitar(no.e, prof + 1, no.v)
    nos.set(no.v, { x: PAD + i * GAP_X, y: PAD + prof * GAP_Y, pai })
    i++
    maxProf = Math.max(maxProf, prof)
    const hd = visitar(no.d, prof + 1, no.v)
    fatores.set(no.v, he - hd)
    return 1 + Math.max(he, hd)
  }
  visitar(arvore, 0, undefined)
  for (const [v, p] of nos) if (p.pai !== undefined) arestas.push([p.pai, v])

  const largura = PAD * 2 + Math.max(0, i - 1) * GAP_X
  const altura = PAD * 2 + maxProf * GAP_Y
  const w = Math.max(largura, MIN_W)
  const h = Math.max(altura, MIN_H)
  return { nos, fatores, arestas, vb: [(largura - w) / 2, 0, w, h], raiz: arvore?.v }
}

export class TreeView {
  constructor(svg) {
    this.svg = svg
    this.pos = new Map()
    this.arestas = []
    this.fantasmas = []
    this.vb = [0, 0, MIN_W, MIN_H]
    this.raiz = undefined
    this.marcas = new Map()
    this.selos = new Map()
    this.fatores = new Map()
    this.mostrarFator = false
    this.desenhar()
  }

  marcar(valor, classe) {
    this.marcas.set(valor, classe)
    this.desenhar()
  }

  selo(valor, numero) {
    this.selos.set(valor, numero)
    this.desenhar()
  }

  limparMarcas() {
    this.marcas.clear()
    this.selos.clear()
    this.desenhar()
  }

  atualizar(arvore, duracao = 550) {
    const alvo = layout(arvore)
    const de = new Map()
    const opacDe = new Map()
    for (const [v, p] of alvo.nos) {
      if (this.pos.has(v)) {
        de.set(v, this.pos.get(v))
        opacDe.set(v, 1)
      } else {
        const pai = p.pai !== undefined ? this.pos.get(p.pai) ?? alvo.nos.get(p.pai) : p
        de.set(v, { x: pai.x, y: pai.y })
        opacDe.set(v, 0)
      }
    }
    const saindo = [...this.pos].filter(([v]) => !alvo.nos.has(v))
    const vbDe = [...this.vb]

    this.arestas = alvo.arestas
    this.raiz = alvo.raiz
    this.fatores = alvo.fatores

    return new Promise((resolve) => {
      const inicio = performance.now()
      const quadro = (agora) => {
        const t = Math.min(1, (agora - inicio) / duracao)
        const k = ease(t)
        const pos = new Map()
        const opac = new Map()
        for (const [v, p] of alvo.nos) {
          const a = de.get(v)
          pos.set(v, { x: lerp(a.x, p.x, k), y: lerp(a.y, p.y, k) })
          opac.set(v, lerp(opacDe.get(v), 1, k))
        }
        this.pos = pos
        this.opac = opac
        this.fantasmas = saindo.map(([v, p]) => ({ v, ...p, o: 1 - k }))
        this.vb = vbDe.map((x, i) => lerp(x, alvo.vb[i], k))
        this.desenhar()
        if (t < 1) requestAnimationFrame(quadro)
        else {
          this.fantasmas = []
          this.desenhar()
          resolve()
        }
      }
      requestAnimationFrame(quadro)
    })
  }

  desenhar() {
    const { svg, pos } = this
    svg.setAttribute('viewBox', this.vb.join(' '))
    svg.setAttribute('preserveAspectRatio', 'xMidYMin meet')

    if (pos.size === 0 && this.fantasmas.length === 0) {
      const [x, , w, h] = this.vb
      svg.innerHTML = `
        <text class="vazia" x="${x + w / 2}" y="${h / 2 - 10}">raiz = NULL</text>
        <text class="vazia-sub" x="${x + w / 2}" y="${h / 2 + 18}">Árvore vazia - insira um valor ou carregue o exemplo</text>`
      return
    }

    let html = ''
    for (const [pai, filho] of this.arestas) {
      const a = pos.get(pai)
      const b = pos.get(filho)
      if (!a || !b) continue
      const ativa = this.marcas.has(pai) && this.marcas.has(filho) ? ' ativa' : ''
      html += `<line class="aresta${ativa}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" style="opacity:${this.opac?.get(filho) ?? 1}"/>`
    }

    if (this.raiz !== undefined && pos.has(this.raiz)) {
      const r = pos.get(this.raiz)
      html += `<text class="rotulo-raiz" x="${r.x}" y="${r.y - R - 10}">raiz</text>`
    }

    for (const f of this.fantasmas) {
      html += this.no(f.v, f.x, f.y, f.o, 'saindo')
    }
    for (const [v, p] of pos) {
      html += this.no(v, p.x, p.y, this.opac?.get(v) ?? 1, this.marcas.get(v) ?? '')
    }
    svg.innerHTML = html
  }

  no(v, x, y, opacidade, classe) {
    const selo = this.selos.get(v)
    const fb = this.fatores.get(v)
    const fator =
      this.mostrarFator && fb !== undefined
        ? `<text class="fator${Math.abs(fb) > 1 ? ' ruim' : ''}" y="${R + 15}">${fb > 0 ? '+' : ''}${fb}</text>`
        : ''
    return `
      <g class="no ${classe}" transform="translate(${x} ${y})" style="opacity:${opacidade}">
        <circle class="anel" r="${R + 7}"/>
        <circle class="corpo" r="${R}"/>
        <text class="valor" dy="0.35em">${v}</text>
        ${fator}
        ${selo !== undefined ? `<g class="selo" transform="translate(${R - 2} ${-R + 2})"><circle r="10"/><text dy="0.35em">${selo}</text></g>` : ''}
      </g>`
  }
}
