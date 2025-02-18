declare namespace supertest {
    export interface Response {
        cookies: { [key: string]: string };
    }
}
