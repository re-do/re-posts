type KeywordsToTypes = {
    string: string
    number: number
    boolean: boolean
    any: any
    // etc...
}

type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
    KeywordsToTypes[Keyword]

// Typed as string
type Result = TypeOfKeyword<"string">

type User = {
    name: {
        first: string
        last: string
    }
    email: string
    isAdmin: boolean
    coords: [number, number]
}

type TypeOfObject<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key] extends keyof KeywordsToTypes
        ? TypeOfKeyword<Obj[Key]>
        : Obj[Key] extends object
        ? TypeOfObject<Obj[Key]>
        : unknown
} & unknown

type Result2 = TypeOfObject<{
    name: {
        first: "string"
        last: "string"
    }
    email: "string"
    isAdmin: "boolean"
    coords: ["number", "number"]
}>

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

type Result3 = TypeOfExpression<`string|number[]?`>

type ValidateExpression<Fragment extends string, Root extends string> =
    // If the expression ends with "?"...
    Fragment extends `${infer Optional}?`
        ? //
          TypeOfExpression<Optional> | undefined
        : // If the expression contains a "|"...
        Fragment extends `${infer Left}|${infer Right}`
        ? // Recurse to infer the type of each half (either is valid).
          TypeOfExpression<Left> | TypeOfExpression<Right>
        : // If the expression ends in "[]"...
        Fragment extends `${infer Item}[]`
        ? // Recurse to infer the type of the inner expression and convert it to a list.
          TypeOfExpression<Item>[]
        : // If the expression is just a keyword...
        Fragment extends keyof KeywordsToTypes
        ? // Use our first generic to infer its type.
          TypeOfKeyword<Fragment>
        : // Else, the expression is not something we've defined yet so infer unknown
          unknown

// Typed as string | number[] | undefined
type Result4 = TypeOfExpression<`string|number[]?`>
