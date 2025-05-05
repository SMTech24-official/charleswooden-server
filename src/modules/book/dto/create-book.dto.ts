import { Length } from "class-validator"

export class CreateBookDto {

    @Length(10, 20)
    title: string;

    @Length(20, 1000)
    description: string
}
