import { NextResponse, type NextRequest } from 'next/server';
import { getProducts } from '@/lib/products/repository';
import { parseProductQuery } from '@/lib/products/params';

export async function GET(request: NextRequest) {
    const parsed = parseProductQuery(request.nextUrl.searchParams);

    if (!parsed.ok) {
        return NextResponse.json(
            { error: 'Nieprawidłowe parametry zapytania', details: parsed.errors },
            { status: 400 },
        );
    }

    try {
        const products = await getProducts(parsed.query);
        return NextResponse.json(products);
    } catch (err) {
        console.error('GET /api/products failed:', err);
        return NextResponse.json({ error: 'Wewnętrzny błąd serwera' }, { status: 500 });
    }
}