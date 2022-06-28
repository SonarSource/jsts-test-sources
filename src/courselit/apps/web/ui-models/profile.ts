export default interface Profile {
    name: string;
    id: string;
    fetched: boolean;
    purchases: any[];
    email: string;
    bio: string;
    permissions: any[];
    userId: string;
}
