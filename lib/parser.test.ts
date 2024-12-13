import { describe, expect, test } from "vitest";

import {
  character,
  Character,
  expression,
  Expression,
  group,
  Group,
  item,
  Item,
  modifier,
  Modifier,
  parse,
  start,
  Start,
  term,
  Term,
} from "./parser";
import type { TokenSequence, ParseResult, ParseFunction } from "./parser";

function testParsingFunction<T>(
  parseFunction: ParseFunction<T>,
  testCases: [TokenSequence, ParseResult<T>][],
): void {
  for (const [tokens, expected] of testCases) {
    const actual = parseFunction(tokens);

    expect(actual).toEqual(expected);
  }
}

describe("Parser", () => {
  test("character", () =>
    testParsingFunction(character, [
      ["", null],
      ["a", [new Character("a"), ""]],
      ["abc", [new Character("a"), "bc"]],
      ["777", [new Character("7"), "77"]],
      [".", [new Character("."), ""]],
      ["^", [new Character("^"), ""]],
      ["$", [new Character("$"), ""]],
      ["&", null],
    ]));

  test("modifier", () =>
    testParsingFunction(modifier, [
      ["", null],
      ["*", [new Modifier("*"), ""]],
      ["+", [new Modifier("+"), ""]],
      ["?", [new Modifier("?"), ""]],
      ["*abc", [new Modifier("*"), "abc"]],
      ["7", null],
    ]));

  test("item", () => {
    testParsingFunction(item, [
      ["", null],
      ["a", [new Item(new Character("a")), ""]],
      ["abc", [new Item(new Character("a")), "bc"]],
      ["7*", [new Item(new Character("7")), "*"]],
    ]);

    testParsingFunction(item, [
      ["", null],
      [
        "(a)",
        [
          new Item(
            new Group(
              new Expression(
                new Term(new Item(new Character("a")), null),
                null,
              ),
            ),
          ),
          "",
        ],
      ],
    ]);
  });

  test("group", () => {
    testParsingFunction(group, [
      ["", null],
      ["(foo", null],
      ["bar)", null],
      [
        "(0)",
        [
          new Group(
            new Expression(new Term(new Item(new Character("0")), null), null),
          ),
          "",
        ],
      ],
    ]);
  });

  test("term", () =>
    testParsingFunction(term, [
      ["", null],
      ["a", [new Term(new Item(new Character("a")), null), ""]],
      ["a*", [new Term(new Item(new Character("a")), new Modifier("*")), ""]],
      ["*", null],
    ]));

  test("expression", () =>
    testParsingFunction(expression, [
      ["", null],
      ["*", null],
      [
        "a",
        [
          new Expression(new Term(new Item(new Character("a")), null), null),
          "",
        ],
      ],
      [
        "ab",
        [
          new Expression(
            new Term(new Item(new Character("a")), null),
            new Expression(new Term(new Item(new Character("b")), null), null),
          ),
          "",
        ],
      ],
      [
        "(ab)+c",
        [
          new Expression(
            new Term(
              new Item(
                new Group(
                  new Expression(
                    new Term(new Item(new Character("a")), null),
                    new Expression(
                      new Term(new Item(new Character("b")), null),
                      null,
                    ),
                  ),
                ),
              ),
              new Modifier("+"),
            ),
            new Expression(new Term(new Item(new Character("c")), null), null),
          ),
          "",
        ],
      ],
    ]));

  test("start", () =>
    testParsingFunction(start, [
      ["", [new Start(null), ""]],
      [
        "a",
        [
          new Start(
            new Expression(new Term(new Item(new Character("a")), null), null),
          ),
          "",
        ],
      ],
    ]));

  describe("parse", () => {
    test("returns a wrapped null value for empty string input", () => {
      const expected = new Start(null);
      const actual = parse("");

      expect(actual).toEqual(expected);
    });

    test("throws for unparsable input", () => {
      expect(() => parse("&%foo")).toThrow();
    });
  });
});
