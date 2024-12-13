import {
  anyCharacter,
  concat,
  Graph,
  either,
  singleCharacter,
  zeroOrMore,
  zeroOrOne,
  start,
  end,
  resetState,
} from "./evaluator";
import {
  Character,
  Expression,
  Group,
  Item,
  Start,
  type SyntaxNode,
  Term,
} from "./parser";

/**
 * Converts the AST representation of a parsed RegEx into a
 * Non-Deterministic Finite Automata represented as a Graph
 */
export function astToGraph(node: SyntaxNode): Graph {
  if (node instanceof Start && node.content !== null) {
    resetState();
    return astToGraph(node.content);
  } else if (node instanceof Expression) {
    if (node.next !== null) {
      if (node.term.precedesPipeOperator === true) {
        return either(astToGraph(node.term), astToGraph(node.next));
      }
      return concat(astToGraph(node.term), astToGraph(node.next));
    } else {
      return astToGraph(node.term);
    }
  } else if (node instanceof Term) {
    if (node.modifier !== null) {
      switch (node.modifier.content) {
        case "?":
          return zeroOrOne(astToGraph(node.item.content));

        case "*":
          return zeroOrMore(astToGraph(node.item.content));

        case "+":
          return concat(
            astToGraph(node.item.content),
            zeroOrMore(astToGraph(node.item.content)),
          );

        default:
          throw new Error(
            `Unexpected Modifier encountered ${node.modifier.content}`,
          );
      }
    } else {
      return astToGraph(node.item.content);
    }
  } else if (node instanceof Group) {
    return astToGraph(node.content);
  } else if (node instanceof Item) {
    return astToGraph(node.content);
  } else if (node instanceof Character) {
    switch (node.content) {
      case ".":
        return anyCharacter(node.content);

      // TODO: get anchors working properly
      case "^":
        return start(node.content);

      // TODO: get anchors working properly
      case "$":
        return end(node.content);

      default:
        return singleCharacter(node.content);
    }
  }

  throw new Error("Failed to convert AST to Graph.");
}
