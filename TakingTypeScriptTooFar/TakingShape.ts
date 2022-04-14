import { ExpressingYourself } from "./ExpressingYourself.js"

namespace TakingShapeFirstAttempt {
    type TypeOf<Def> =
        // If Def is an object...
        Def extends object
            ? {
                  // For each Key in Def, recurse to infer the type of its value.
                  [Key in keyof Def]: TypeOf<Def[Key]>
              }
            : // If Def is a string...
            Def extends string
            ? // Use our last generic to infer its type.
              ExpressingYourself.TypeOfExpression<Def>
            : // Else, the value is not something we've defined yet so infer unknown
              unknown

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
}

export namespace TakingShape {
    type TypeOf<Def> = Def extends object
        ? TypeOfObject<Def>
        : Def extends string
        ? ExpressingYourself.TypeOfExpression<Def>
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
    > = Def extends any[] // We don't need to worry about optional keys for tuples, so infer their type normally
        ? { [Index in keyof Def]: TypeOf<Def[Index]> }
        : // Otherwise, use our precalculated key sets to merge the inferred types of our optional and required keys
          Evaluate<
              { [Key in RequiredKeys]: TypeOf<Def[Key]> } & {
                  [Key in OptionalKeys]?: TypeOf<Def[Key]>
              }
          >

    // In: An object definition
    // Out: The keys of that definition whose values match our Optional expression template
    export type OptionalDefKeys<Obj extends object> = {
        // Map keys that should be optional to themselves, and others to never, excluding them from the type
        [Key in keyof Obj]: Obj[Key] extends `${string}?` ? Key : never
        // Extract all values (other than never) from the result, yielding keys whose values are Optionals
    }[keyof Obj]

    // This is just a trick to force TS to eagerly evaluate generics, improving type hints
    export type Evaluate<T> = T extends object
        ? {
              [K in keyof T]: T[K]
          }
        : T

    type Validate<Def> =
        // If Def is an object...
        Def extends object
            ? {
                  // For each Key in Def, recurse to validate its value.
                  [Key in keyof Def]: Validate<Def[Key]>
              }
            : // If Def is a string...
            Def extends string
            ? // Use our last generic to validate it.
              ExpressingYourself.ValidateExpression<Def>
            : // Else, since our parser only understands strings and objects (for now!), return an error.
              `Error: Definitions must be strings or objects whose leaves are strings.`

    // Allows TS to infer the exact type of an object passed to a function
    export type Narrow<T> = {
        [K in keyof T]: T[K] extends [] // Nonsense required to appease the type inference gods
            ? T[K]
            : T[K] extends object
            ? Narrow<T[K]>
            : T[K]
    }

    const parse = <Def>(definition: Validate<Narrow<Def>>): TypeOf<Def> => {
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
}
