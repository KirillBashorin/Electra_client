import { useState, useEffect, useCallback } from 'react';
import {
  StyledMyElectra,
  MyElectraTitle,
  TitleLogo,
  TotalEarnings,
  TotalEarningsAmount,
  StyledCommunication,
  NoNfts,
  NoNftsText,
  // MultiClaim,
  // MultiClaimInner,
  // MultiClaimText,
  // MultiClaimAmount,
} from './styled';
import MyElectraHero from '../../blocks/my-electra-hero/my-electra-hero';
import {
  useContractRead,
  useContractReads,
  // useContractWrite,
  useWalletClient,
} from 'wagmi';
import MyElectraTokensList from '../../blocks/my-electra-tokens-list/my-electra-tokens-list';
import StakingStrategiesData from '../../../contracts/stakingStrategies.json';
import { TitleSize } from '../../ui/title/title';
import ElectraLogo from '../../../assets/logo-gradient.svg';
import Wrapper from '../../layout/wrapper/wrapper';
import Button from '../../ui/button/button';
// import { encodeFunctionData } from 'viem';
// import StakingStrategies from '../../../contracts/stakingStrategies.json';
import Moped from '../../../contracts/moped.json';
import { t } from 'i18next';
// import Tokens from '../../../contracts/tokens.json';

interface IMyElectra {
  isLoggedIn: boolean;
  connectWallet: () => void;
}

const MyElectra: React.FC<IMyElectra> = ({ isLoggedIn, connectWallet }) => {
  const [sortedData, setSortedData] = useState<any>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  // const [totalForClaim, setTotalForClaim] = useState(0);
  // const [encodedMulicallClaimData, setEncodedMulicallClaimData] = useState<
  //   string | `0x${string}`[]
  // >('');

  const userWalletAddress = useWalletClient().data?.account.address;
  // const { data: walletClient } = useWalletClient();

  const { data: userNFTCount } = useContractRead({
    address: Moped.address as `0x${string}`,
    abi: Moped.abi,
    functionName: 'balanceOf',
    args: [userWalletAddress],
    watch: true,
  });

  interface IContract {
    address: `0x${string}`;
    abi: any[];
    functionName: string;
    args: any[];
  }

  interface ICcreatePropContractByCount {
    (count: number): IContract[];
  }

  const createPropContractByCount: ICcreatePropContractByCount = (count) => {
    const contracts: IContract[] = [];
    for (let i = 0; i < count; i++) {
      contracts.push({
        address: Moped.address as `0x${string}`,
        abi: Moped.abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [userWalletAddress as `0x${string}`, i],
      });
    }
    return contracts;
  };

  const { data: userTokens } = useContractReads({
    contracts: createPropContractByCount(Number(userNFTCount)),
  });

  const createConfigStakingStrategy = () => {
    const contractSettings: IContract[] =
      userTokens?.map((tokenId) => {
        return {
          address: Moped.address as `0x${string}`,
          abi: Moped.abi,
          functionName: 'tokenStakingStrategy',
          args: [tokenId.result],
        };
      }) || [];

    return contractSettings;
  };

  const { data: tokensStakingStrategies } = useContractReads({
    contracts: createConfigStakingStrategy(),
  });

  const createConfigGetTokenData = () => {
    const contractSettings =
      userTokens?.map((tokenId, index) => {
        const strategyAddress = tokensStakingStrategies
          ? tokensStakingStrategies[index].result
          : '0x';

        const matchingItem = StakingStrategiesData.find((item) => {
          return (
            String(item.address) ===
            String(tokensStakingStrategies?.[index].result)
          );
        });

        const strategyAbi = matchingItem?.abi || [];

        return [
          {
            address: strategyAddress as `0x${string}`,
            abi: strategyAbi,
            functionName: 'initialTimestamp',
            args: [Moped.address, tokenId.result],
          },
          {
            address: Moped.address as `0x${string}`,
            abi: Moped.abi,
            functionName: 'name',
          },
          {
            address: strategyAddress as `0x${string}`,
            abi: strategyAbi,
            functionName: 'totalWithdrawn',
            args: [Moped.address, tokenId.result],
          },
          {
            address: strategyAddress as `0x${string}`,
            abi: strategyAbi,
            functionName: 'estimateRewards',
            args: [Moped.address, tokenId.result],
          },
          {
            address: strategyAddress as `0x${string}`,
            abi: strategyAbi,
            functionName: 'canSell',
            args: [Moped.address, tokenId.result],
          },
          {
            address: strategyAddress as `0x${string}`,
            abi: strategyAbi,
            functionName: 'estimateSell',
            args: [Moped.address, tokenId.result],
          },
        ];
      }) || [];

    return contractSettings.flat() as IContract[];
  };

  const { data: tokensData, isLoading: isTokensDataLoading } = useContractReads(
    {
      contracts: createConfigGetTokenData(),
      watch: true,
    }
  );

  interface IMyElectraItem {
    date: number;
    nft: string;
    tokenId: number;
    investmentType: string;
    earned: number;
    canClaim: any[];
    canSell: boolean;
    sellingPrice: number;
  }

  const sortTokensData = useCallback<
    (data: ITokensDataItem[] | []) => IMyElectraItem[][]
  >(
    (data: any) => {
      const reducedData = data?.reduce((acc: any, curr: any, index: any) => {
        const groupSize = 6;
        const chunkIndex = Math.floor(index / groupSize);

        if (!acc[chunkIndex]) {
          acc[chunkIndex] = [];
        }

        acc[chunkIndex].push(curr);

        return acc;
      }, [] as any[][]);

      const structuredData: any = [];

      reducedData?.forEach((item: any, index: any) => {
        const structuredItem = {
          date: item[0].result,
          nft: item[1].result,
          earned: item[2].result,
          canClaim: item[3].result,
          canSell: item[4].result,
          sellingPrice: item[5].result,
          tokenId: userTokens?.[index].result,
          investmentType: tokensStakingStrategies?.[index].result || null,
          quantity: 1,
        };

        structuredData.push(structuredItem);
      });

      const stackedData: any = [];
      const stackedIDs: any = [];

      structuredData?.forEach((firstItem: any) => {
        if (!stackedIDs?.includes(firstItem.tokenId)) {
          const stackedItem = structuredData.filter((secondItem: any) => {
            if (
              firstItem.date === secondItem.date &&
              firstItem.investmentType === secondItem.investmentType
            ) {
              stackedIDs.push(secondItem.tokenId);
              return secondItem;
            } else {
              return;
            }
          });

          if (stackedItem) {
            stackedData.push(stackedItem);
          } else {
            stackedData.push(firstItem);
          }
        }
      });

      return stackedData;
    },
    [tokensStakingStrategies, userTokens]
  );

  interface ITokensDataItem {
    error?: Error | undefined;
    result?:
      | string
      | number
      | boolean
      | string[]
      | number[]
      | boolean[]
      | undefined;
    status: string;
  }

  // const estimateTotalClaim = () => {
  //   let total = 0;

  //   sortedData.forEach((itemsGroups: IMyElectraItem[]) => {
  //     itemsGroups.forEach((item) => {
  //       total += Number(item.canClaim[0]) / 1e18;
  //     });
  //   });

  //   return total;
  // };

  useEffect(() => {
    const sortedData = sortTokensData(tokensData || []);
    setSortedData(sortedData);
  }, [tokensData, sortTokensData]);

  useEffect(() => {
    let total = 0;

    sortedData.forEach((itemsGroups: IMyElectraItem[]) => {
      itemsGroups.forEach((item) => {
        total += Number(item.earned) / 1e18;
      });
    });

    setTotalEarnings(total);
    // setTotalForClaim(estimateTotalClaim());

    // const getStakingStrategyABI = (address: string): any[] => {
    //   const findedItem = StakingStrategies.find((itemStrategy) =>
    //     itemStrategy.address === address ? itemStrategy.abi : []
    //   );
    //   const findedABI = findedItem?.abi;
    //   return findedABI ? findedABI : [];
    // };

    // sortedData?.forEach((itemGroup: IMyElectraItem[]) => {
    //   itemGroup.forEach((item: IMyElectraItem) => {
    //     const encodedData = encodeFunctionData({
    //       abi: getStakingStrategyABI(item.investmentType),
    //       functionName: 'claim',
    //       args: [Moped.address, item.tokenId, Tokens[0].address],
    //     });
    //     setEncodedMulicallClaimData([...encodedMulicallClaimData, encodedData]);
    //     console.log('encMCD', encodedMulicallClaimData);
    //   });
    // });
  }, [sortedData]);

  // const { write: multicallClaim, isLoading: multicallClaiming } =
  //   useContractWrite({
  //     address: item[0].investmentType as `0x${string}`,
  //     abi: getStakingStrategyABI(item[0].investmentType),
  //     functionName: 'multicall',
  //     account: walletClient?.account,
  //     args: [encodedMulicallClaimData],
  //   });

  return (
    <main>
      {isLoggedIn ? (
        <StyledMyElectra>
          <Wrapper>
            <MyElectraTitle size={TitleSize.BIG} as={'h1'}>
              My
              <TitleLogo src={ElectraLogo} alt="Electra" />
            </MyElectraTitle>
            {isTokensDataLoading ? (
              'Loading...'
            ) : sortedData && sortedData.length ? (
              <>
                <TotalEarnings>
                  {t('my-electra:total-earnings')}:{' '}
                  <TotalEarningsAmount>
                    {totalEarnings.toFixed(2)} $
                  </TotalEarningsAmount>
                </TotalEarnings>
                <MyElectraTokensList items={sortedData} />
                {/* <MultiClaim>
                  <MultiClaimInner>
                    <MultiClaimText>
                      Claim all rewards from all your vehicles:
                    </MultiClaimText>
                    <MultiClaimAmount>
                      {totalForClaim.toFixed(2)} $
                    </MultiClaimAmount>
                  </MultiClaimInner>
                  <Button isSmall={true}>Claim</Button>
                </MultiClaim> */}
              </>
            ) : (
              <NoNfts>
                <NoNftsText>{t('my-electra:no-nfts')}</NoNftsText>
                <Button to={'/market'} isSmall={true}>
                  {t('my-electra:go-market')}
                </Button>
              </NoNfts>
            )}
          </Wrapper>
          <StyledCommunication />
        </StyledMyElectra>
      ) : (
        <MyElectraHero connectWallet={connectWallet} />
      )}
    </main>
  );
};

export default MyElectra;
