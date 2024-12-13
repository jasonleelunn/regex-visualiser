type MatchingFunction = (...character: string[]) => boolean;

// a unique named matching function that always returns false
// which represents state transitions (links) that do not consume
// a character, but are useful for connecting graphs together
const EPSILON: MatchingFunction = () => false;

export function matchAny(): MatchingFunction {
  const fn = () => true;
  fn.toString = () => "ANY";
  return fn;
}

export function matchEqual(characterToMatch: string): MatchingFunction {
  const fn = (character: string) => character === characterToMatch;
  fn.toString = () => `${characterToMatch}`;
  return fn;
}

// TODO: something better than this?
export function resetState(): void {
  stateCount = 0;
}

let stateCount = 0;

export class StateNode {
  creationTime: number;
  stateNumber: number;

  constructor() {
    this.creationTime = Date.now();
    this.stateNumber = stateCount;
    stateCount++;
  }

  toString(): string {
    return `S${this.stateNumber}`;
  }

  id(): string {
    return `${this.toString()}-${this.creationTime}`;
  }
}

export class RuleLink {
  start: StateNode;
  end: StateNode;
  matchingFunction: MatchingFunction;

  constructor(
    start: StateNode,
    end: StateNode,
    matchingFunction: MatchingFunction,
  ) {
    this.start = start;
    this.end = end;
    this.matchingFunction = matchingFunction;
  }

  match(character: string): boolean {
    return this.matchingFunction(character);
  }

  isEpsilon(): boolean {
    return this.matchingFunction === EPSILON;
  }

  toString(): string {
    return this.isEpsilon() ? "ε" : this.matchingFunction.toString();
  }

  id(): string {
    return this.start.id() + this.toString() + this.end.id();
  }
}

export class Graph {
  label: string;
  start: StateNode;
  end: StateNode;
  rules: RuleLink[];

  constructor(
    label: string,
    start: StateNode,
    end: StateNode,
    rules: RuleLink[],
  ) {
    this.label = label;
    this.start = start;
    this.end = end;
    this.rules = rules;
  }
}

export class Evaluator {
  graph: Graph;
  steps: string[][];

  constructor(graph: Graph) {
    this.graph = graph;
  }

  // TODO: perf optimisation using hash map instead of all sets
  match(string: string): boolean {
    let states = this.followEpsilons(this.graph.start);

    this.steps =
      states.size > 0 ? [Array.from(states.values()).map((s) => s.id())] : [];

    for (const char of string) {
      const rules = this.matchingRules(states, char);
      let nextStates = new Set<StateNode>();

      for (const rule of rules) {
        const epsilonStates = this.followEpsilons(rule.end);

        epsilonStates.forEach((state) => nextStates.add(state));
      }

      states = nextStates;

      if (rules.length > 0) {
        this.steps.push(rules.map((r) => r.id()));
      }
      if (states.size > 0) {
        this.steps.push(Array.from(states.values()).map((s) => s.id()));
      }
    }

    return states.has(this.graph.end);
  }

  followEpsilons(state: StateNode): Set<StateNode> {
    const resolvedStates = new Set<StateNode>();
    resolvedStates.add(state);

    for (const rule of this.graph.rules) {
      if (rule.isEpsilon() && rule.start === state && rule.start !== rule.end) {
        const endStates = this.followEpsilons(rule.end);

        endStates.forEach((state) => resolvedStates.add(state));
      }
    }

    return resolvedStates;
  }

  matchingRules(states: Set<StateNode>, character: string): RuleLink[] {
    const matchingRules: RuleLink[] = [];

    for (const rule of this.graph.rules) {
      if (states.has(rule.start) && rule.match(character)) {
        matchingRules.push(rule);
      }
    }

    return matchingRules;
  }
}

export function singleCharacter(character: string): Graph {
  const start = new StateNode();
  const end = new StateNode();

  return new Graph(character, start, end, [
    new RuleLink(start, end, matchEqual(character)),
  ]);
}

export function anyCharacter(_: string): Graph {
  const start = new StateNode();
  const end = new StateNode();

  return new Graph(".", start, end, [new RuleLink(start, end, matchAny())]);
}

// TODO: get anchors working properly
export function start(_: string): Graph {
  const start = new StateNode();

  return new Graph("^", start, start, [new RuleLink(start, start, EPSILON)]);
}

// TODO: get anchors working properly
export function end(_: string): Graph {
  const end = new StateNode();

  return new Graph("$", end, end, [new RuleLink(end, end, EPSILON)]);
}

export function zeroOrOne(subject: Graph): Graph {
  const start = new StateNode();
  const end = new StateNode();

  return new Graph(`${subject.label}?`, start, end, [
    ...subject.rules,
    new RuleLink(start, end, EPSILON),
    new RuleLink(start, subject.start, EPSILON),
    new RuleLink(subject.end, end, EPSILON),
  ]);
}

export function zeroOrMore(subject: Graph): Graph {
  const start = new StateNode();
  const end = new StateNode();

  return new Graph(`${subject.label}*`, start, end, [
    ...subject.rules,
    new RuleLink(start, end, EPSILON),
    new RuleLink(start, subject.start, EPSILON),
    new RuleLink(subject.end, end, EPSILON),
    new RuleLink(subject.end, subject.start, EPSILON),
  ]);
}

export function concat(left: Graph, right: Graph): Graph {
  return new Graph(`${left.label}${right.label}`, left.start, right.end, [
    ...left.rules,
    ...right.rules,
    new RuleLink(left.end, right.start, EPSILON),
  ]);
}

export function either(left: Graph, right: Graph): Graph {
  return new Graph(`${left.label}|${right.label}`, left.start, right.end, [
    ...left.rules,
    ...right.rules,
    new RuleLink(left.start, right.start, EPSILON),
    new RuleLink(left.end, right.end, EPSILON),
  ]);
}
