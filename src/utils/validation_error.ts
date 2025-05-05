import { Prisma } from '@prisma/client';
import { IGenericErrorMessage } from 'src/error/error';
import { IGenericErrorResponse } from 'src/interface/common';
// adjust the path if needed

export const handleValidationError = (
  error: Prisma.PrismaClientValidationError,
): IGenericErrorResponse => {
  const errors: IGenericErrorMessage[] = [
    {
      path: '',
      message: error.message,
    },
  ];

  return {
    statusCode: 400,
    message: 'Validation Error',
    errorMessages: errors,
  };
};
