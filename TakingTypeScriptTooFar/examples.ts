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

type TypeOfExpression<Expression extends string> =
    Expression extends `${infer Optional}?`
        ? TypeOfExpression<Optional> | undefined
        : Expression extends `${infer Right}|${infer Left}`
        ? TypeOfExpression<Right> | TypeOfExpression<Left>
        : Expression extends `${infer Item}[]`
        ? TypeOfExpression<Item>[]
        : Expression extends keyof KeywordsToTypes
        ? TypeOfKeyword<Expression>
        : unknown

type ValidateExpression<Expression extends string> = ValidateFragment<
    Expression,
    Expression
>

type ValidateFragment<
    Fragment extends string,
    Root extends string
> = Fragment extends `${infer Optional}?`
    ? ValidateFragment<Optional, Root>
    : Fragment extends `${infer Right}|${infer Left}`
    ? ValidateFragment<Right, Root> extends Root
        ? ValidateFragment<Left, Root>
        : ValidateFragment<Right, Root>
    : Fragment extends `${infer Item}[]`
    ? ValidateFragment<Item, Root>
    : Fragment extends keyof KeywordsToTypes
    ? Root
    : `Error: ${Fragment} is not a valid expression.`

const parseExpression = <Expression extends string>(
    expression: ValidateExpression<Expression>
): TypeOfExpression<Expression> => {
    // The actual return value is irrelevant since we're just using it to infer a shallow type (for now)
    return null as any
}

const goodType = parseExpression("string|number[]?")

// @ts-expect-error
const badType = parseExpression("string|numbr[]?")

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
          TypeOfExpression<Def>
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
    ? TypeOfExpression<Def>
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
    ? ValidateExpression<Def>
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

type Middle = typeof user.name.middle
