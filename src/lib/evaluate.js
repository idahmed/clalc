function tokenize(source) {
  const tokens = []
  const input = source
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('π', 'pi')
    .trim()

  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i += 1
      continue
    }
    if (/[0-9.]/.test(ch)) {
      let value = ch
      i += 1
      while (i < input.length && /[0-9.]/.test(input[i])) {
        value += input[i]
        i += 1
      }
      if ((value.match(/\./g) || []).length > 1) throw new Error('Bad number')
      tokens.push({ type: 'number', value: Number(value) })
      continue
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ type: ch })
      i += 1
      continue
    }
    if (/[a-z]/i.test(ch)) {
      let name = ch
      i += 1
      while (i < input.length && /[a-z]/i.test(input[i])) {
        name += input[i]
        i += 1
      }
      tokens.push({ type: 'name', value: name.toLowerCase() })
      continue
    }
    throw new Error('Bad token')
  }
  return tokens
}

function makeParser(tokens, ctx) {
  let pos = 0

  function peek() {
    return tokens[pos]
  }

  function consume(type) {
    const token = tokens[pos]
    if (!token || (type && token.type !== type)) throw new Error('Unexpected token')
    pos += 1
    return token
  }

  function parseExpression() {
    return parseAdd()
  }

  function parseAdd() {
    let value = parseMul()
    while (peek() && (peek().type === '+' || peek().type === '-')) {
      const op = consume().type
      const right = parseMul()
      value = op === '+' ? value + right : value - right
    }
    return value
  }

  function parseMul() {
    let value = parsePow()
    while (peek() && (peek().type === '*' || peek().type === '/')) {
      const op = consume().type
      const right = parsePow()
      value = op === '*' ? value * right : right === 0 ? NaN : value / right
    }
    return value
  }

  function parsePow() {
    let value = parseUnary()
    if (peek() && peek().type === '^') {
      consume('^')
      const right = parsePow()
      value **= right
    }
    return value
  }

  function parseUnary() {
    if (peek() && peek().type === '+') {
      consume('+')
      return parseUnary()
    }
    if (peek() && peek().type === '-') {
      consume('-')
      return -parseUnary()
    }
    return parsePrimary()
  }

  function parsePrimary() {
    const token = peek()
    if (!token) throw new Error('Unexpected end')

    if (token.type === 'number') {
      consume()
      return token.value
    }

    if (token.type === 'name') {
      consume()
      if (token.value === 'pi') return Math.PI
      if (token.value === 'e') return Math.E
      if (peek() && peek().type === '(') {
        consume('(')
        const arg = parseExpression()
        consume(')')
        return applyFn(token.value, arg, ctx)
      }
      throw new Error('Bad name')
    }

    if (token.type === '(') {
      consume('(')
      const value = parseExpression()
      consume(')')
      return value
    }

    throw new Error('Unexpected token')
  }

  return {
    parseExpression,
    done: () => pos >= tokens.length,
  }
}

function applyFn(name, value, ctx) {
  switch (name) {
    case 'sin':
      return Math.sin(ctx.toRad(value))
    case 'cos':
      return Math.cos(ctx.toRad(value))
    case 'tan':
      return Math.tan(ctx.toRad(value))
    case 'asin':
      return ctx.fromRad(Math.asin(value))
    case 'acos':
      return ctx.fromRad(Math.acos(value))
    case 'atan':
      return ctx.fromRad(Math.atan(value))
    case 'ln':
      return value <= 0 ? NaN : Math.log(value)
    case 'log':
      return value <= 0 ? NaN : Math.log10(value)
    case 'sqrt':
      return value < 0 ? NaN : Math.sqrt(value)
    case 'sq':
      return value * value
    default:
      throw new Error('Unknown function')
  }
}

export function evaluate(source, ctx) {
  if (!source || !String(source).trim()) return 0
  const tokens = tokenize(String(source))
  const parser = makeParser(tokens, ctx)
  const value = parser.parseExpression()
  if (!parser.done()) throw new Error('Unexpected token')
  return value
}
