# Taking TypeScript too far: Can types parse their own syntax?

![82-million character type error](./82MillionCharacterTsError.png)

Now, I know you might be thinking "Oh look, another developer using TypeScript types to achieve something completely impractical just to prove it's possible."

And you're right.

Using generic types and template strings to parse types from their definitions _is_ completely impractical. But- and you'll have to hear me out on this- it may not be completely useless.

Have you ever spent hours meticulously defining TypeScript types just for them to be compiled away when you need them to validate your data at runtime? Not only is it frustrating to have to translate them from TypeScript to whatever format your validator (Zod, Yup, JOI, etc.) understands, it duplicates code that is:

-   Likely to require frequent updates
-   Normally not necessary to test
-   Relied on as a single source of truth

There have been attempts to mitigate this; Zod in particular has done a great job with type inference. Unfortunately, even they claim that:

> "Because of a limitation of TypeScript, types from recursive schemas can't be statically inferred."

So once again, we find ourselves having to duplicate our types, as well as to translate them into a rather unwieldy construct like this one:

> ```ts
> interface Category {
>     name: string
>     subcategories: Category[]
> }
>
> // cast to z.ZodType<Category>
> const Category: z.ZodType<Category> = z.lazy(() =>
>     z.object({
>         name: z.string(),
>         subcategories: z.array(Category)
>     })
> )
> ```

To me, this schema definition feels a little yucky, especially compared to the TypeScript syntax we're trying to replicate. All of this just begs the question: how close can we get to TypeScript syntax within the confines of JavaScript?

The answer probably looks something like this:

```ts
const category = {
    name: "string",
    subcategories: "Category[]"
}
```

This looks a lot more natural, but to use it, we'll need to be able to:

1. Write some function(s) to parse JS objects and strings to validate data at runtime
2. Write some generic types(s) to convert a definition to the type it represents

`1` is definitely achievable; with just a few `typeof` comparisons and some RegEx, we're off to the recursive races. But what about `2`? What really _are_ the limitations of TypeScript?

## Starting small

When I'm trying to wrap my head around a tough problem, I like to start by answering the question "what does the simplest version of this look like?"

In this case, the simplest definition from which we could infer a type is a keyword like `"string"` or `"number"`. Luckily, [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) actually make this fairly straight forward for us. You've probably seen generics like `Array<string>` or `Partial<Options>`, but they're remarkably flexible. I find it helpful to think of them as functions that take one or more types as input and return a new one.

```ts
// Map keywords to their corresponding types
type KeywordsToTypes = {
    string: string
    number: number
    boolean: boolean
    any: any
    // etc...
}

/**
 * In: One of the string keys from the map we defined
 * Out: The corresponding type
 **/
type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
    KeywordsToTypes[Keyword]

// Typed as string
type Result = TypeOfKeyword<"string">
```

This is all well and good for primitives, but it's not very useful in isolation- most types worth explicitly defining have a little more depth to them. What about objects?

## Taking shape

Suppose we have the following `user` type:

```ts
type User = {
    name: {
        first: string
        last: string
    }
    email: string
    isAdmin: boolean
    coords: [number, number]
}
```

During validation, we might care about other things like whether an email address is properly formatted. We'll get to that soon, but let's make sure we can support TypeScript's built-in types before we try to extend them.

We can convert the structure of our definition by combining two of TypeScript's most flexible features- [Mapped](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) (think `Array.map` for the props of a type) and [Conditional](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) (think ternaries) types.

<!-- prettier-ignore -->
```ts
type TypeOfObject<Obj extends object> = {
    // For each Key in Obj
    [Key in keyof Obj]: 
        // If the corresponding value is a keyword...
        Obj[Key] extends keyof KeywordsToTypes
        // Use our first generic to infer its type.
        ? TypeOfKeyword<Obj[Key]>
        // Else if the corresponding value is a nested object...
        : Obj[Key] extends object
        ? // Recurse to infer its type.
          TypeOfObject<Obj[Key]>
        : // Else, the value is not something we've defined yet so infer unknown
          unknown
    // The "& unknown" is a little trick that forces TS to eagerly evaluate nested objects so you can see the full type when you mouse over it
} & unknown

// The result is identical to our original User type
type User = TypeOfObject<{
    name: {
        first: "string"
        last: "string"
    }
    email: "string"
    isAdmin: "boolean"
    coords: ["number", "number"]
}>
```

The ability to organize predefined keywords into familiar structures like maps and tuples is necessary, but to call any of this "parsing" is a stretch. TypeScript's real power and flexibility come from arbitrarily composable expressions like Lists (`A[]`), Unions (`A|B`), and Optionals (`A?`), among many others.

Is there any hope for an endeavoring type enthusiast hoping to extract a meaningful type from a definition like `string|number[]?`?

## Expressing yourself
