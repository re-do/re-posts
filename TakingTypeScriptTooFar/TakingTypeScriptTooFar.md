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
    null: null
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

This is all well and good for primitives, but to call this "parsing" is a stretch. TypeScript's real power lies in the flexibility to define types using arbitrarily composable expressions like Lists (`A[]`), Unions (`A|B`), Optionals (`{key?: value}`), and many more.

Is there any hope for an endeavoring type enthusiast hoping to extract a meaningful type from a definition like `string|number[]?`?

## Expressing yourself

Enter [Conditional](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) and [Template Literal](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) types. If you've never seen them before, don't worry- they're just ternaries (`condition ? valueIfTrue : valueIfFalse`) and template strings (`` `Hello, ${name}.` ``) for types. Together, they're just what we need to take ourselves to the next level of type-ception.

<!-- prettier-ignore -->
```ts
type TypeOfExpression<Expression extends string> =
    // If the expression ends with "?"...
    Expression extends `${infer Optional}?`
    // Recurse to infer the type of the inner expression and add undefined as a valid type.
    ? TypeOfExpression<Optional> | undefined
    // If the expression includes "|"...
    : Expression extends `${infer Left}|${infer Right}`
    // Recurse to infer the type of each half (either is valid).
    ? TypeOfExpression<Left> | TypeOfExpression<Right>
    // If the expression ends in "[]"...
    : Expression extends `${infer Item}[]`
    // Recurse to infer the type of the inner expression and convert it to a list.
    ? TypeOfExpression<Item>[]
    // If the expression is just a keyword...
    : Expression extends keyof KeywordsToTypes
    // Use our first generic to infer its type.
    ? TypeOfKeyword<Expression>
    // Else, the expression is not something we've defined yet so infer unknown
    : unknown

// Typed as string | number[] | undefined
type Result = TypeOfExpression<`string|number[]?`>
```

Note: If `undefined` is not included in `Result`, you need to set "strict" or "strictNullChecks" to true in your [tsconfig](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

It's important to consider the order in which these extends checks are performed. For example, if we had checked whether our expression matches `${infer Item}[]` before `${Left}|${Right}`, the result would have been `(string | number)[] | undefined`, which would be inconsistent with TypeScript in which unions have precedence over lists.

At this point, we also might want to think more about what happens when the definition is invalid; it's easy to make a mistake when you're typing an expression in a string. Luckily, we can adapt the model we've created in `TypeOfExpression` for a new generic that will give us helpful type hints if anything goes awry:

<!-- prettier-ignore -->
```ts
/**
 * In:
 *    Fragment: The part of the expression we are currently validating
 *    Root: The entire original expression
 * Out:
 *    If the Fragment (and all nested Fragments) is valid:
 *        Return Root (the original expression).
 *    If the Fragment (or a nested Fragment) is invalid:
 *        Return a string describing the part of the Fragment that was invalid.
 **/
type ValidateFragment<Fragment extends string, Root extends string> = 
    // If the expression ends with "?"...
    Fragment extends `${infer Optional}?`
    // Recurse to validate the inner expression.
    ? ValidateFragment<Optional, Root>
    // If the expression includes "|"...
    : Fragment extends `${infer Left}|${infer Right}`
    // Recurse to validate the first half. If the result is valid...
    ? ValidateFragment<Left, Root> extends Root
        // Recurse to validate the second half and return the result.
        ? ValidateFragment<Right, Root>
        // Else return the error from the first half.
        : ValidateFragment<Left, Root>
    // If the expression ends with "[]"...
    : Fragment extends `${infer Item}[]`
    // Recurse to validate the inner expression.
    ? ValidateFragment<Item, Root>
    // If the expression is just a keyword...
    : Fragment extends keyof KeywordsToTypes
    // It is valid, so return Root (the original expression).
    ? Root
    // Else, the expression doesn't match anything we've defined, so return an error message.
    : `Error: '${Fragment}' is not a valid expression.`

// Helper type to avoid having to pass the entire expression to ValidateFragment twice
type ValidateExpression<Expression extends string> = ValidateFragment<
    Expression,
    Expression
>
```

By returning the original input when its valid, we can use `ValidateExpression` directly to provide type hints for a `parse` function that takes an expression and uses `TypeOfExpression` to infer its type:

```ts
const parseExpression = <Expression extends string>(
    expression: ValidateExpression<Expression>
): TypeOfExpression<Expression> => {
    // The actual return value is irrelevant (for now) since we're just using it to infer a type
    return null as any
}

// No type errors
// goodType inferred as string | number[] | undefined
const goodType = parseExpression("string|number[]?")

// Argument of type '"string|numbr[]?"' is not assignable to parameter of type '"Error: numbr is not a valid expression."'
// badType inferred as unknown
const badType = parseExpression("string|numbr[]?")
```

We could expand this proof of concept to handle intersections, literals, arrow functions, and more! For a TypeScript nerd like me, that's all really exciting from a theoretical perspective. Practically, though, expressions will only take us so far in isolation. Most types worth defining have a little more structure than a even a well-validated string can accomodate (at least without making most devs want to tear their eyes out). Might there be a more bearable approach for dealing with objects?

## Taking shape

Suppose we have the following `user` type:

```ts
type User = {
    name: {
        first: string
        middle?: string
        last: string
    }
    emails: string[] | null
    coords: [number, number]
}
```

At runtime, we might care about other things like whether email addresses are properly formatted. We'll get to that soon, but let's make sure we can support TypeScript's built-in types before we try to extend them.

In the meantime, we can convert a structured definition to a type by incorporating another one of TypeScript's most powerful features- [Mapped](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) types.

<!-- prettier-ignore -->
```ts
type TypeOfV1<Def> = 
    // If Def is an object...
    Def extends object
    ? {
          // For each Key in Def, recurse to infer the type of its value.
          [Key in keyof Def]: TypeOfV1<Def[Key]>
      }
    // If Def is a string...
    : Def extends string
    // Use our last generic to infer its type.
    ? TypeOfExpression<Def>
    // Else, the value is not something we've defined yet so infer unknown   
    : unknown
```

Simple enough, and the results look perfect... almost. Unfortunately, in this case, the devil's in the details. Take a look at the type we infer:

```ts
const Def = {
    name: {
        first: "string",
        middle: "string?",
        last: "string"
    },
    emails: "string[]|null",
    coords: ["number", "number"]
}

type InferredType = {
    name: {
        first: string
        // Undefined is added a possible value, but the key is still required
        middle: string | undefined
        last: string
    }
    emails: string[] | null
    coords: [number, number]
}
```

This is where we start to encounter some of the... quirks... of using generic types to solve the kinds of problems that would be trivial if we had access to normal imperative programming constructs, but alas, we press on.

This next snippet is the most complex I'll try to address in this article, but not necessarily required reading if you'd rather [skip to the payout](#TODO) when (spoilers) everything comes together.

<!-- prettier-ignore -->
```ts
type TypeOfV2<Def> = 
    Def extends object
    ? TypeOfObject<Def>
    : Def extends string
    ? TypeOfExpression<Def>
    : unknown

type TypeOfObject<
    Def extends object,
    /** 
     * We don't have access to traditional variables when writing generic types,
     * but we can emulate them to store intermediate computation results by assigning
     * default values to generic parameters. Just don't pass a value to them unless
     * you want to overwrite the default!
     **/
    OptionalKeys extends keyof Def = OptionalDefKeys<Def>,
    RequiredKeys extends keyof Def = Exclude<keyof Def, OptionalKeys>
> = // We don't need to worry about optional keys for tuples, so infer their type normally
    Def extends any[]
    ? { [Index in keyof Def]: TypeOfV2<Def[Index]> }
    // Otherwise, use our precalculated key sets to merge the inferred types of our optional and required keys
    : Evaluate<
          { [Key in RequiredKeys]: TypeOfV2<Def[Key]> } & {
              [Key in OptionalKeys]?: TypeOfV2<Def[Key]>
          }
      >

// In: An object definition
// Out: The keys of that definition whose values match our Optional expression template
type OptionalDefKeys<Obj extends object> = {
    // Map keys that should be optional to themselves, and others to never, excluding them from the type
    [Key in keyof Obj]: Obj[Key] extends `${string}?` ? Key : never
// Extract all values (other than never) from the result, yielding keys whose values are Optionals
}[keyof Obj]

// This is just a trick to force TS to eagerly evaluate generics, improving type hints 
type Evaluate<T> = T extends object
    ? {
          [K in keyof T]: T[K]
      }
    : T

```

A little less simple, but now our inferred type really _is_ perfect. We do still need an updated `parse` function that can handle objects. Luckily, that's at least a little more straightforward.

<!-- prettier-ignore -->
```ts
type Validate<Def> = 
    // If Def is an object...
    Def extends object
    ? {
          // For each Key in Def, recurse to validate its value.
          [Key in keyof Def]: Validate<Def[Key]>
      }
    // If Def is a string...
    : Def extends string
    // Use our last generic to validate it.
    ? ValidateExpression<Def>
    // Else, since our parser only understands strings and objects (for now!), return an error.
    : `Error: Definitions must be strings or objects whose leaves are strings.`


// Allows TS to infer the exact type of an object passed to a function
type Narrow<T> = {
    [K in keyof T]:
        // Nonsense required to appease the type inference gods
        T[K] extends []
        ? T[K]
        : T[K] extends object
        ? Narrow<T[K]>
        : T[K]
}


const parse = <Def>(definition: Validate<Narrow<Def>>): TypeOfV2<Def> => {
    // Allows extraction of a type from an arbitrary chain of props
    const typeDefProxy: any = new Proxy({}, { get: () => typeDefProxy })
    return typeDefProxy
}

// Inferred type is identical to our original definition
const user = parse({
    name: {
        first: "string",
        middle: "string?",
        last: "string"
    },
    emails: "string[]|null",
    coords: ["number", "number"]
})

// Types can also be safely inferred from props
type Middle = typeof user.name.middle // string | undefined
```

Let's take stock of where we stand. So far, we can...

-   Infer types from built-in keywords
-   Use validated expressions to combine and modify those types
-   Organize our types into objects
