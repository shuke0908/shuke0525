import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 지원되는 암호화폐 목록 (다중 네트워크 지원)
    const coins = [
      {
        id: 1,
        symbol: 'BTC',
        name: 'Bitcoin',
        icon: '₿',
        networks: [
          {
            name: 'Bitcoin',
            chainId: 'bitcoin',
            minDeposit: 0.001,
            minWithdrawal: 0.001,
            withdrawalFee: 0.0005,
            confirmations: 3,
            isActive: true
          }
        ],
        currentPrice: 43250.50,
        priceChange24h: 2.45,
        isActive: true
      },
      {
        id: 2,
        symbol: 'ETH',
        name: 'Ethereum',
        icon: 'Ξ',
        networks: [
          {
            name: 'Ethereum',
            chainId: 'ethereum',
            minDeposit: 0.01,
            minWithdrawal: 0.01,
            withdrawalFee: 0.005,
            confirmations: 12,
            isActive: true
          },
          {
            name: 'BSC',
            chainId: 'bsc',
            minDeposit: 0.01,
            minWithdrawal: 0.01,
            withdrawalFee: 0.001,
            confirmations: 15,
            isActive: true
          }
        ],
        currentPrice: 2650.75,
        priceChange24h: 1.85,
        isActive: true
      },
      {
        id: 3,
        symbol: 'USDT',
        name: 'Tether USD',
        icon: '₮',
        networks: [
          {
            name: 'Ethereum',
            chainId: 'ethereum',
            minDeposit: 10,
            minWithdrawal: 10,
            withdrawalFee: 5,
            confirmations: 12,
            isActive: true
          },
          {
            name: 'BSC',
            chainId: 'bsc',
            minDeposit: 10,
            minWithdrawal: 10,
            withdrawalFee: 1,
            confirmations: 15,
            isActive: true
          },
          {
            name: 'Tron',
            chainId: 'tron',
            minDeposit: 10,
            minWithdrawal: 10,
            withdrawalFee: 1,
            confirmations: 20,
            isActive: true
          }
        ],
        currentPrice: 1.00,
        priceChange24h: 0.02,
        isActive: true
      },
      {
        id: 4,
        symbol: 'BNB',
        name: 'BNB',
        icon: '🔶',
        networks: [
          {
            name: 'BSC',
            chainId: 'bsc',
            minDeposit: 0.01,
            minWithdrawal: 0.01,
            withdrawalFee: 0.001,
            confirmations: 15,
            isActive: true
          }
        ],
        currentPrice: 315.80,
        priceChange24h: 3.25,
        isActive: true
      },
      {
        id: 5,
        symbol: 'XRP',
        name: 'Ripple',
        icon: '◉',
        networks: [
          {
            name: 'Ripple',
            chainId: 'ripple',
            minDeposit: 1,
            minWithdrawal: 1,
            withdrawalFee: 0.1,
            confirmations: 1,
            isActive: true
          }
        ],
        currentPrice: 0.62,
        priceChange24h: -1.25,
        isActive: true
      },
      {
        id: 6,
        symbol: 'SOL',
        name: 'Solana',
        icon: '◎',
        networks: [
          {
            name: 'Solana',
            chainId: 'solana',
            minDeposit: 0.1,
            minWithdrawal: 0.1,
            withdrawalFee: 0.01,
            confirmations: 1,
            isActive: true
          }
        ],
        currentPrice: 98.45,
        priceChange24h: 4.15,
        isActive: true
      },
      {
        id: 7,
        symbol: 'ADA',
        name: 'Cardano',
        icon: '₳',
        networks: [
          {
            name: 'Cardano',
            chainId: 'cardano',
            minDeposit: 5,
            minWithdrawal: 5,
            withdrawalFee: 1,
            confirmations: 15,
            isActive: true
          }
        ],
        currentPrice: 0.48,
        priceChange24h: 2.85,
        isActive: true
      },
      {
        id: 8,
        symbol: 'AVAX',
        name: 'Avalanche',
        icon: '🔺',
        networks: [
          {
            name: 'Avalanche',
            chainId: 'avalanche',
            minDeposit: 0.1,
            minWithdrawal: 0.1,
            withdrawalFee: 0.01,
            confirmations: 1,
            isActive: true
          }
        ],
        currentPrice: 36.75,
        priceChange24h: 1.95,
        isActive: true
      }
    ];

    // 쿼리 파라미터 처리
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    const network = url.searchParams.get('network');

    let filteredCoins = coins;

    // 특정 코인 필터링
    if (symbol) {
      filteredCoins = coins.filter(coin => 
        coin.symbol.toLowerCase() === symbol.toLowerCase()
      );
    }

    // 네트워크별 필터링
    if (network) {
      filteredCoins = filteredCoins.map(coin => ({
        ...coin,
        networks: coin.networks.filter(net => 
          net.name.toLowerCase() === network.toLowerCase()
        )
      })).filter(coin => coin.networks.length > 0);
    }

    // 활성 코인만 필터링
    const activeCoins = filteredCoins.filter(coin => coin.isActive);

    return NextResponse.json({
      success: true,
      data: {
        coins: activeCoins,
        totalCoins: activeCoins.length,
        supportedNetworks: [
          'Bitcoin', 'Ethereum', 'BSC', 'Tron', 'Ripple', 
          'Solana', 'Cardano', 'Avalanche'
        ],
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Supported coins fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supported coins' },
      { status: 500 }
    );
  }
} 