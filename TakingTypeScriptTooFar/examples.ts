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
