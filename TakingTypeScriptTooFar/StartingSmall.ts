export namespace StartingSmall {
    export type KeywordsToTypes = {
        string: string
        number: number
        boolean: boolean
        null: null
        any: any
        // etc...
    }

    export type TypeOfKeyword<Keyword extends keyof KeywordsToTypes> =
        KeywordsToTypes[Keyword]

    // Typed as string
    type Result = TypeOfKeyword<"string">
}
