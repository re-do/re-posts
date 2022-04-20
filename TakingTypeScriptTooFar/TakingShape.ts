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
    // Out: A union representing the set of keys from that definition whose values match our Optional expression template
    export type OptionalDefKeys<Def extends object> = {
        // For each key of Def...
        [Key in keyof Def]: Def[Key] extends  // If the corresponding value from Def ends with "?"...
        `${string}?`
            ? // Map the key to itself (e.g. {optionalKey: "number?"} => {optionalKey: "optionalKey"}).
              Key
            : // Map the key to never to exclude it from the result (e.g. {requiredKey: "number"} => {requiredKey: never}).
              never
        // Extract all values (other than never) from the result, yielding the set of keys whose values end in "?"
    }[keyof Def]

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

    /** Allows TS to infer the exact type of an object passed to a function, so that when a definition like:
     *      {prop: "string|number[]?"}
     *  is passed through a parameter, its type is not widened to:
     *      {prop: string}
     *  It's critical we avoid this behavior so that the original definition is preserved.
     **/
    type Narrow<T> = {
        [K in keyof T]: T[K] extends [] // Nonsense required to appease the type inference gods
            ? T[K]
            : T[K] extends object
            ? Narrow<T[K]>
            : T[K]
    }

    const parse = <Def>(definition: Validate<Narrow<Def>>): TypeOf<Def> => {
        // Create a proxy that returns itself as the value of any prop
        const typeDefProxy = new Proxy({}, { get: () => typeDefProxy })
        // By returning this value, types can be extracted from arbitrary chains of props without throwing at runtime
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
