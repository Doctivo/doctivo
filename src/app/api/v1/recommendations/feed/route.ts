import { NextRequest, NextResponse } from 'next/server';
import { buildRecommendationFeed } from '@/lib/recommendations/engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined;
    const userId = searchParams.get('userId') || undefined;
    const locality = searchParams.get('locality') || undefined;
    const symptomQuery = searchParams.get('q') || searchParams.get('symptom') || undefined;

    const feed = await buildRecommendationFeed({
      lat,
      lng,
      userId,
      locality,
      symptomQuery,
    });

    return NextResponse.json(feed, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: any) {
    console.error('API /v1/recommendations/feed error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to generate recommendation feed', error: error.message },
      { status: 500 }
    );
  }
}
