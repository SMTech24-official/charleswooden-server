import { IsInt } from "class-validator";

export class FindAllParams {
    
    @IsInt()
    page: number;

    @IsInt()
    limit: number;
}