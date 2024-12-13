import { describe, expect, test } from "vitest";

import {
  anyCharacter,
  concat,
  Evaluator,
  matchAny,
  matchEqual,
  either,
  singleCharacter,
  zeroOrMore,
  zeroOrOne,
  start,
  end,
} from "./evaluator";

describe("Matchers", () => {
  test("matchAny", () => {
    const matchAnyFunc = matchAny();

    expect(matchAnyFunc()).toEqual(true);
  });

  test("matchEqual", () => {
    const matchA = matchEqual("a");

    expect(matchA("a")).toEqual(true);
    expect(matchA("b")).toEqual(false);
  });

  test("singleCharacter", () => {
    const graph = singleCharacter("a");

    expect(graph.label).toEqual("a");
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].match("a")).toEqual(true);
    expect(graph.rules[0].match("b")).toEqual(false);
  });

  test("anyCharacter", () => {
    const graph = anyCharacter("a");

    expect(graph.label).toEqual(".");
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].match("a")).toEqual(true);
    expect(graph.rules[0].match("b")).toEqual(true);
  });

  test("start", () => {
    const graph = start("");

    expect(graph.label).toEqual("^");
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].isEpsilon()).toEqual(true);
    expect(graph.start).toEqual(graph.end);
  });

  test("end", () => {
    const graph = end("");

    expect(graph.label).toEqual("$");
    expect(graph.rules).toHaveLength(1);
    expect(graph.rules[0].isEpsilon()).toEqual(true);
    expect(graph.start).toEqual(graph.end);
  });

  test("zeroOrOne", () => {
    const subjectGraph = singleCharacter("a");
    const graph = zeroOrOne(subjectGraph);

    expect(graph.label).toEqual("a?");
    expect(graph.rules).toHaveLength(4);
    expect(graph.rules[0].match("a")).toEqual(true);
    expect(graph.rules[0].match("b")).toEqual(false);
    expect(graph.rules[1].isEpsilon()).toEqual(true);
    expect(graph.rules[2].isEpsilon()).toEqual(true);
    expect(graph.rules[3].isEpsilon()).toEqual(true);
  });

  test("zeroOrMore", () => {
    const subjectGraph = singleCharacter("a");
    const graph = zeroOrMore(subjectGraph);

    expect(graph.label).toEqual("a*");
    expect(graph.rules).toHaveLength(5);
    expect(graph.rules[0].match("a")).toEqual(true);
    expect(graph.rules[0].match("b")).toEqual(false);
    expect(graph.rules[1].isEpsilon()).toEqual(true);
    expect(graph.rules[2].isEpsilon()).toEqual(true);
    expect(graph.rules[3].isEpsilon()).toEqual(true);
    expect(graph.rules[4].isEpsilon()).toEqual(true);
  });

  test("concat", () => {
    const leftSubjectGraph = singleCharacter("a");
    const rightSubjectGraph = singleCharacter("b");
    const graph = concat(leftSubjectGraph, rightSubjectGraph);

    expect(graph.label).toEqual("ab");
    expect(graph.rules).toHaveLength(3);
    expect(graph.rules[0].match("a")).toEqual(true);
    expect(graph.rules[1].match("b")).toEqual(true);
    expect(graph.rules[2].isEpsilon()).toEqual(true);
  });

  test("either", () => {
    const leftSubjectGraph = singleCharacter("a");
    const rightSubjectGraph = singleCharacter("b");
    const graph = either(leftSubjectGraph, rightSubjectGraph);

    expect(graph.label).toEqual("a|b");
    expect(graph.rules).toHaveLength(4);
    expect(graph.rules[0].match("a")).toEqual(true);
    expect(graph.rules[1].match("b")).toEqual(true);
    expect(graph.rules[2].isEpsilon()).toEqual(true);
    expect(graph.rules[3].isEpsilon()).toEqual(true);
  });
});

describe("Evaluator", () => {
  describe("(he)*lo*l", () => {
    const evaluator = new Evaluator(
      concat(
        concat(
          zeroOrMore(concat(singleCharacter("h"), singleCharacter("e"))),
          singleCharacter("l"),
        ),
        concat(zeroOrMore(singleCharacter("o")), singleCharacter("l")),
      ),
    );

    const testCases = [
      { input: "", isExpectedMatch: false },
      { input: "foo", isExpectedMatch: false },
      { input: "ll", isExpectedMatch: true },
      { input: "lol", isExpectedMatch: true },
      { input: "looooool", isExpectedMatch: true },
      { input: "hell", isExpectedMatch: true },
      { input: "hehell", isExpectedMatch: true },
      { input: "hhell", isExpectedMatch: false },
      { input: "heheheloool", isExpectedMatch: true },
      { input: "hehehe", isExpectedMatch: false },
    ];

    for (const { input, isExpectedMatch } of testCases) {
      const testTitle = `${input} should ${isExpectedMatch ? "" : "not "}match`;

      test(testTitle, () => {
        expect(evaluator.match(input)).toEqual(isExpectedMatch);
      });
    }
  });
});
