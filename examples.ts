type KeywordsToTypes = {
  string: string;
  number: number;
  boolean: boolean;
  any: any;
  // etc...
};

type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
  KeywordsToTypes[Keyword];

// Typed as string
type Result = TypeOfKeyword<"string">;
