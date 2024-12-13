import { describe, expect, test } from "vitest";

import { Evaluator } from "./evaluator";
import { astToGraph } from "./graph";
import { parse } from "./parser";

/**
 * the Map key is the input RegEx
 * the Map value is an array of test cases
 * the test cases are tuples representing [the string to match, isExpectedMatch]
 */
type TestSuites = Map<string, [string, boolean][]>;

describe("astToGraph", () => {
  test("(hi)*", () => {
    const regex = "(hi)*";
    const ast = parse(regex);

    expect(ast).not.toBeNull();

    const graph = astToGraph(ast!);

    expect(graph.label).toEqual("hi*");
    expect(graph.rules.length).toEqual(7);

    expect(graph.rules[0].match("h")).toEqual(true);
    expect(graph.rules[1].match("i")).toEqual(true);

    expect(graph.rules[2].isEpsilon()).toEqual(true);
    expect(graph.rules[3].isEpsilon()).toEqual(true);
    expect(graph.rules[4].isEpsilon()).toEqual(true);
    expect(graph.rules[5].isEpsilon()).toEqual(true);
    expect(graph.rules[6].isEpsilon()).toEqual(true);
  });

  test("hi.", () => {
    const regex = "hi.";
    const ast = parse(regex);

    expect(ast).not.toBeNull();

    const graph = astToGraph(ast!);

    expect(graph.label).toEqual("hi.");
    expect(graph.rules.length).toEqual(5);
    expect(graph.rules[0].match("h")).toEqual(true);
    expect(graph.rules[1].match("i")).toEqual(true);

    // expected to be a matchAny rule
    expect(graph.rules[2].match("j")).toEqual(true);
    expect(graph.rules[2].match("k")).toEqual(true);
    expect(graph.rules[2].match("l")).toEqual(true);

    expect(graph.rules[3].isEpsilon()).toEqual(true);
    expect(graph.rules[4].isEpsilon()).toEqual(true);
  });
});

describe("Entire Engine", () => {
  const testSuites: TestSuites = new Map();

  testSuites.set("hi.", [
    ["foo", false],
    ["hi", false],
    ["hi.", true],
    ["him", true],
    ["hih", true],
    ["hi!", true],
    ["hi ", true],
    ["hiii", false],
  ]);

  testSuites.set(".+", [
    ["", false],
    ["hi", true],
    ["h", true],
    ["hhh", true],
    ["hih", true],
  ]);

  testSuites.set("a|b", [
    ["", false],
    ["ab", false],
    ["a", true],
    ["b", true],
  ]);

  testSuites.set("(ab)|c", [
    ["", false],
    ["abc", false],
    ["ab", true],
    ["c", true],
  ]);

  testSuites.set("(ab)*|c", [
    ["", true],
    ["abc", false],
    ["ab", true],
    ["c", true],
    ["abab", true],
  ]);

  testSuites.set("(ab)+|c|(foo)", [
    ["", false],
    ["abc", false],
    ["abcfoo", false],
    ["ab", true],
    ["c", true],
    ["foo", true],
    ["abab", true],
    ["cfoo", false],
  ]);

  testSuites.set("^foo", [
    ["foo", true],
    ["^foo", false],
    ["afoo", false],
    [" foo", false],
  ]);

  testSuites.set("bar$", [
    ["bar", true],
    ["bar$", false],
    ["bard", false],
    ["bar ", false],
  ]);

  testSuites.set("^baz$", [
    ["baz", true],
    ["^baz$", false],
    ["abaz", false],
    ["bazz", false],
    [" bar ", false],
    ["bar ", false],
    [" bar", false],
  ]);

  testSuites.set("(hi)|^bye.*", [
    ["hi", true],
    ["bye", true],
    ["bye bye!", true],
    ["^bye", false],
    ["hibye", false],
  ]);

  testSuites.set("^0*|1*$", [
    ["", true],
    ["0", true],
    ["1", true],
    ["000", true],
    ["111", true],
    [" 0", false],
    ["1 ", false],
  ]);

  testSuites.set("a^b$c", [
    ["", false],
    ["abc", false],
  ]);

  for (const [regex, testCases] of testSuites) {
    describe(`RegEx: ${regex}`, () => {
      const ast = parse(regex);

      expect(ast).not.toBeNull();

      const graph = astToGraph(ast!);
      const evaluator = new Evaluator(graph);

      for (const [input, isExpectedMatch] of testCases) {
        const testTitle = `${input === "" ? "an empty string" : input} should ${isExpectedMatch ? "" : "not "}match`;

        test(testTitle, () => {
          expect(evaluator.match(input)).toEqual(isExpectedMatch);
        });
      }
    });
  }
});
