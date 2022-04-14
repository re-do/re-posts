type KeywordsToTypes = {
    string: string
    number: number
    boolean: boolean
    null: null
    any: any
    // etc...
}

type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
    KeywordsToTypes[Keyword]

// Typed as string
type Result = TypeOfKeyword<"string">

type TypeOfExpressionV1<Expression extends string> =
    Expression extends `${infer Optional}?`
        ? TypeOfExpressionV1<Optional> | undefined
        : Expression extends `${infer Right}|${infer Left}`
        ? TypeOfExpressionV1<Right> | TypeOfExpressionV1<Left>
        : Expression extends `${infer Item}[]`
        ? TypeOfExpressionV1<Item>[]
        : Expression extends keyof KeywordsToTypes
        ? TypeOfKeyword<Expression>
        : unknown

type ValidateExpressionV1<Expression extends string> = ValidateFragmentV1<
    Expression,
    Expression
>

type ValidateFragmentV1<
    Fragment extends string,
    Root extends string
> = Fragment extends `${infer Optional}?`
    ? ValidateFragmentV1<Optional, Root>
    : Fragment extends `${infer Right}|${infer Left}`
    ? ValidateFragmentV1<Right, Root> extends Root
        ? ValidateFragmentV1<Left, Root>
        : ValidateFragmentV1<Right, Root>
    : Fragment extends `${infer Item}[]`
    ? ValidateFragmentV1<Item, Root>
    : Fragment extends keyof KeywordsToTypes
    ? Root
    : `Error: ${Fragment} is not a valid expression.`

const parseExpressionV1 = <Expression extends string>(
    expression: ValidateExpressionV1<Expression>
): TypeOfExpressionV1<Expression> => {
    // The actual return value is irrelevant since we're just using it to infer a shallow type (for now)
    return null as any
}

const goodType = parseExpressionV1("string|number[]?")

// @ts-expect-error
const badType = parseExpressionV1("string|numbr[]?")

type User = {
    name: {
        first: string
        middle?: string
        last: string
    }
    emails: string[] | null
    coords: [number, number]
}

type TypeOfV1<Def> =
    // If Def is an object...
    Def extends object
        ? {
              // For each Key in Def, recurse to infer the type of its value.
              [Key in keyof Def]: TypeOfV1<Def[Key]>
          }
        : // If Def is a string...
        Def extends string
        ? // Use our last generic to infer its type.
          TypeOfExpressionV1<Def>
        : // Else, the value is not something we've defined yet so infer unknown
          unknown

type ResultV1 = TypeOfV1<{
    name: {
        first: "string"
        middle: "string?"
        last: "string"
    }
    emails: "string[]|null"
    coords: ["number", "number"]
}>

type OptionalDefKeys<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key] extends `${string}?` ? Key : never
}[keyof Obj]

type TypeOfObject<
    Def extends object,
    OptionalKeys extends keyof Def = OptionalDefKeys<Def>,
    RequiredKeys extends keyof Def = Exclude<keyof Def, OptionalKeys>
> = Def extends any[]
    ? { [Index in keyof Def]: TypeOfV2<Def[Index]> }
    : Evaluate<
          { [Key in RequiredKeys]: TypeOfV2<Def[Key]> } & {
              [Key in OptionalKeys]?: TypeOfV2<Def[Key]>
          }
      >

type TypeOfV2<Def> = Def extends object
    ? TypeOfObject<Def>
    : Def extends string
    ? TypeOfExpressionV1<Def>
    : unknown

type Evaluate<T> = T extends object
    ? {
          [K in keyof T]: T[K]
      }
    : T

type Validate<Def> = Def extends object
    ? {
          [Key in keyof Def]: Validate<Def[Key]>
      }
    : Def extends string
    ? ValidateExpressionV1<Def>
    : `Error: Definitions must be strings or objects whose leaves are strings.`

export type Narrow<T> = {
    [K in keyof T]: T[K] extends []
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

const user = parse({
    name: {
        first: "string",
        middle: "string?",
        last: "string"
    },
    emails: "string[]|null",
    coords: ["number", "number"]
})
