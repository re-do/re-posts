# Taking TypeScript too far: Can types parse their own syntax?

Now, I know you might be thinking "Oh look, another developer using TypeScript types to achieve something completely impractical just to prove it's possible."

And you're right.

Using generic types and template strings to parse types from their definitions _is_ completely impractical. But- and you'll have to hear me out on this- it may not be completely useless.

Have you ever spent hours meticulously defining TypeScript types just for them to be compiled away when you need them to validate your data at runtime? Not only is it frustrating to have to translate them from TypeScript to whatever format your validator (Zod, Yup, JOI, etc.) understands, it duplicates code that is:

- Likely to require frequent updates
- Normally not necessary to test
- Relied on as a single source of truth

There have been attempts to mitigate this; Zod in particular has done a great job with type inference. Unfortunately, even they claim that:

> "Because of a limitation of TypeScript, types from recursive schemas can't be statically inferred."

So once again, we find ourselves having to duplicate our types, as well as to translate them into a rather unwieldy construct like this one:

> ```ts
> interface Category {
>   name: string;
>   subcategories: Category[];
> }
>
> // cast to z.ZodType<Category>
> const Category: z.ZodType<Category> = z.lazy(() =>
>   z.object({
>     name: z.string(),
>     subcategories: z.array(Category),
>   })
> );
> ```

To me, this schema definition feels a little yucky, especially compared to the TypeScript syntax we're trying to replicate. All of this just begs the question: how close can we get to TypeScript syntax within the confines of JavaScript?

The answer probably looks something like this:

```ts
const Category = {
  name: "string",
  subcategories: "Category[]",
};
```

This looks a lot more natural, but to use it, we'll need to be able to:

1. Write some function(s) to parse JS objects and strings to validate data at runtime
2. Write some generic types(s) to convert a definition to the type it represents

`1` is definitely achievable; with just a few `typeof` comparisons and some RegEx, we're off to the recursive races. But what about `2`? What really _are_ the limitations of TypeScript?

## Starting small

When I'm trying to wrap my head around a tough problem, I like to start by answering the question "what does the simplest version of this look like?"

In this case, the simplest definition from which we could infer a type is a keyword like `"string"` or `"number"`. Luckily, generics actually make this fairly straight forward for us. You've probably seen generics like `Array<string>` or `Partial<Options>`, but they're remarkably flexible. As a model, I find it helpful to think of them as functions that take one or more types as input and return a new one.

```ts
// Map keywords to their corresponding types
type KeywordsToTypes = {
  string: string;
  number: number;
  boolean: boolean;
  any: any;
  // etc...
};

/**
 * In: One of the string keys from the map we defined
 * Out: The corresponding type
 **/
type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
  KeywordsToTypes[Keyword];

// Typed as string
type Result = TypeOfKeyword<"string">;
```
