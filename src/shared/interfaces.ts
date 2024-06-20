export interface ErrorDetails {
    statusCode: string | null;
    errorMessage: string | null;
    jsonData: { [key: string]: any } | null;
}

export interface ResponseDto {
    isSuccess: boolean;
    result: any | null;
    displayMessage: string;
    error: ErrorDetails;
}
