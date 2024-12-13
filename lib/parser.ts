// Character  ::= LITERAL_CHARS (simple ASCII alphanumeric chars) & SPECIAL_CHARS
// Modifier   ::= MODIFIER_CHARS (subset of valid RegEx modifier chars)
// Item       ::= Character | Group
// Group      ::= '(' Expression ')'
// Term       ::= Item Modifier | Item
// Expression ::= Term Expression | Term

export type SyntaxNode =
  | Start
  | Expression
  | Term
  | Item
  | Group
  | Modifier
  | Character;

export type TokenSequence = string;

export type ParseResult<T> = [T, TokenSequence] | null;

export type ParseFunction<T> = (tokens: TokenSequence) => ParseResult<T>;

const LITERAL_CHARS =
  " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!";

const SPECIAL_CHARS = ".^$";

const MODIFIER_CHARS = "*+?";

const PIPE_CHAR = "|";

export class Character {
  content: string;

  constructor(content: string) {
    this.content = content;
  }

  toString(): string {
    return this.content;
  }
}

export function character(tokens: TokenSequence): ParseResult<Character> {
  if (
    tokens.length > 0 &&
    (LITERAL_CHARS.includes(tokens[0]) || SPECIAL_CHARS.includes(tokens[0]))
  ) {
    return [new Character(tokens[0]), tokens.slice(1)];
  }

  return null;
}

export class Modifier {
  content: string;

  constructor(content: string) {
    this.content = content;
  }

  toString(): string {
    return this.content;
  }
}

export function modifier(tokens: TokenSequence): ParseResult<Modifier> {
  if (tokens.length > 0 && MODIFIER_CHARS.includes(tokens[0])) {
    return [new Modifier(tokens[0]), tokens.slice(1)];
  }

  return null;
}

export class Item {
  content: Character | Group;

  constructor(content: Character | Group) {
    this.content = content;
  }

  toString(): string {
    return this.content.toString();
  }
}

export function item(tokens: TokenSequence): ParseResult<Item> {
  const characterResult = character(tokens);
  if (characterResult !== null) {
    return [new Item(characterResult[0]), characterResult[1]];
  }

  const groupResult = group(tokens);
  if (groupResult !== null) {
    return [new Item(groupResult[0]), groupResult[1]];
  }

  return null;
}

export class Group {
  content: Expression;

  constructor(content: Expression) {
    this.content = content;
  }

  toString(): string {
    return `(${this.content.toString()})`;
  }
}

export function group(tokens: TokenSequence): ParseResult<Group> {
  if (tokens.length > 0 && tokens[0] === "(") {
    const expressionResult = expression(tokens.slice(1));

    if (expressionResult !== null) {
      const [expression, tokensAfterExpression] = expressionResult;

      if (
        tokensAfterExpression.length > 0 &&
        tokensAfterExpression[0] === ")"
      ) {
        return [new Group(expression), tokensAfterExpression.slice(1)];
      }
    }
  }

  return null;
}

export class Term {
  item: Item;
  modifier: Modifier | null;
  precedesPipeOperator: boolean;

  constructor(
    item: Item,
    modifier: Modifier | null,
    precedesPipeOperator = false,
  ) {
    this.item = item;
    this.modifier = modifier;
    this.precedesPipeOperator = precedesPipeOperator;
  }

  toString(): string {
    let str = this.item.toString();

    if (this.modifier !== null) {
      str += this.modifier.toString();
    }

    return str;
  }
}

export function term(tokens: TokenSequence): ParseResult<Term> {
  const itemResult = item(tokens);

  if (itemResult !== null) {
    const [item, tokensAfterItem] = itemResult;
    const modifierResult = modifier(tokensAfterItem);

    if (modifierResult !== null) {
      const [modifier, tokensAfterModifier] = modifierResult;

      if (
        tokensAfterModifier.length > 0 &&
        tokensAfterModifier[0] === PIPE_CHAR
      ) {
        const tokensAfterPipe = tokensAfterModifier.slice(1);
        return [new Term(item, modifier, true), tokensAfterPipe];
      }

      return [new Term(item, modifier), tokensAfterModifier];
    }

    if (tokensAfterItem.length > 0 && tokensAfterItem[0] === PIPE_CHAR) {
      const tokensAfterPipe = tokensAfterItem.slice(1);
      return [new Term(item, null, true), tokensAfterPipe];
    }

    return [new Term(item, null), tokensAfterItem];
  }

  return null;
}

export class Expression {
  term: Term;
  next: Expression | null;

  constructor(term: Term, next: Expression | null) {
    this.term = term;
    this.next = next;
  }

  toString(): string {
    let str = this.term.toString();

    if (this.next !== null) {
      str += this.next.toString();
    }

    return str;
  }
}

export function expression(tokens: TokenSequence): ParseResult<Expression> {
  const termResult = term(tokens);

  if (termResult !== null) {
    const [term, tokensAfterTerm] = termResult;
    const expressionResult = expression(tokensAfterTerm);

    if (expressionResult !== null) {
      const [expression, tokensAfterExpression] = expressionResult;
      return [new Expression(term, expression), tokensAfterExpression];
    }

    return [new Expression(term, null), tokensAfterTerm];
  }

  return null;
}

export class Start {
  content: Expression | null;

  constructor(content: Expression | null) {
    this.content = content;
  }

  toString(): string {
    return this.content !== null ? this.content.toString() : "";
  }
}

export function start(tokens: TokenSequence): ParseResult<Start> {
  const expressionResult = expression(tokens);

  if (expressionResult !== null) {
    const [expression, tokensAfterExpression] = expressionResult;
    return [new Start(expression), tokensAfterExpression];
  }

  return [new Start(null), tokens];
}

export function parse(tokens: TokenSequence): Start | null {
  const result = start(tokens);

  if (result !== null) {
    const [parsed, tokensAfterParsed] = result;

    if (tokensAfterParsed.length > 0) {
      throw new Error(
        `Failed to parse RegEx.
Parsed: "${tokens.slice(0, tokens.length - tokensAfterParsed.length)}"
Not parsed: "${tokensAfterParsed}"`,
      );
    }

    return parsed;
  }

  return null;
}
