import { TakingShape } from "./TakingShape.js"
import { StartingSmall } from "./StartingSmall.js"

export namespace FinalIngredient {
    type TypeOfObject<
        Def extends object,
        Space,
        OptionalKeys extends keyof Def = TakingShape.OptionalDefKeys<Def>,
        RequiredKeys extends keyof Def = Exclude<keyof Def, OptionalKeys>
    > = Def extends any[]
        ? { [Index in keyof Def]: TypeOf<Def[Index], Space> }
        : TakingShape.Evaluate<
              { [Key in RequiredKeys]: TypeOf<Def[Key], Space> } & {
                  [Key in OptionalKeys]?: TypeOf<Def[Key], Space>
              }
          >

    type TypeOf<Def, Space = {}> = Def extends object
        ? TypeOfObject<Def, Space>
        : Def extends string
        ? TypeOfExpression<Def, Space>
        : unknown

    type Validate<Def, Space = {}> = Def extends object
        ? {
              [Key in keyof Def]: Validate<Def[Key]>
          }
        : Def extends string
        ? ValidateExpression<Def, Space>
        : `Error: Definitions must be strings or objects whose leaves are strings.`

    type Category = {
        name: string
        subcategories: Category[]
    }

    type TypeOfExpression<
        Expression extends string,
        Space
    > = Expression extends `${infer Optional}?`
        ? TypeOfExpression<Optional, Space> | undefined
        : Expression extends `${infer Right}|${infer Left}`
        ? TypeOfExpression<Right, Space> | TypeOfExpression<Left, Space>
        : Expression extends `${infer Item}[]`
        ? TypeOfExpression<Item, Space>[]
        : Expression extends keyof StartingSmall.KeywordsToTypes
        ? StartingSmall.TypeOfKeyword<Expression>
        : Expression extends keyof Space
        ? TypeOf<Space[Expression], Space>
        : unknown

    type ValidateExpression<
        Expression extends string,
        Space
    > = ValidateFragment<Expression, Expression, Space>

    type ValidateFragment<
        Fragment extends string,
        Root extends string,
        Space
    > = Fragment extends `${infer Optional}?`
        ? ValidateFragment<Optional, Root, Space>
        : Fragment extends `${infer Right}|${infer Left}`
        ? ValidateFragment<Right, Root, Space> extends Root
            ? ValidateFragment<Left, Root, Space>
            : ValidateFragment<Right, Root, Space>
        : Fragment extends `${infer Item}[]`
        ? ValidateFragment<Item, Root, Space>
        : Fragment extends keyof StartingSmall.KeywordsToTypes
        ? Root
        : Fragment extends keyof Space
        ? Root
        : `Error: ${Fragment} is not a valid expression.`

    type InferredCategory = TypeOf<
        "category",
        { category: { name: "string"; subcategories: "category[]" } }
    >

    const category1: InferredCategory = {
        name: "Ok",
        // @ts-expect-error
        subcategories: [{ name: "Not ok", subsandwiches: [] }]
    }
}
