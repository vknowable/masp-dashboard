import Header from "../components/Header";
import InfoGridContainer from "../components/infoGrid/InfoGridContainer";
import AssetTableContainer from "../components/assetTable/AssetTableContainer";
import IbcChannelsContainer from "../components/ibcChannels/IbcChannelsContainer";
import ChartContainer from "../components/chart/ChartContainer";
import StakingRewardsContainer from "../components/stakingRewards/StakingRewardsContainer";
import ShieldedRewardsContainer from "../components/shieldedRewards/ShieldedRewardsContainer";

interface DashboardProps {
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
}

const Dashboard = ({ darkMode, setDarkMode }: DashboardProps) => {
    return (
        <div className="min-h-screen flex flex-col p-[24px] bg-white dark:bg-[#121212] text-black dark:text-white">
            <header className="flex justify-between items-center">
                <Header />
                {/* <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                    {darkMode ? '☀️' : '🌙'}
                </button> */}
            </header>

            <main className="flex-1 pb-16">
                <StakingRewardsContainer />
                <ShieldedRewardsContainer />
                <AssetTableContainer />
                {/* <InfoGridContainer /> */}
                <ChartContainer />
                <IbcChannelsContainer />
            </main>
        </div>
    );
};

export default Dashboard;
