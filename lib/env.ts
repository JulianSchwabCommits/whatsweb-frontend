const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!backendUrl) {
    throw new Error(
        'Please create a .env file with NEXT_PUBLIC_BACKEND_URL variable set.'
    );
}

export const BACKEND_URL = backendUrl;