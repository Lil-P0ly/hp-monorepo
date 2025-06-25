import React, { useState, useEffect } from 'react';
import {
  MantineProvider,
  AppShell,
  Title,
  Paper,
  Text,
  Tabs,
  Container,
  Button,
  Flex,
  useMantineTheme
} from '@mantine/core';
import TelegramWebApp from '@twa-dev/sdk';
import ActivityChart from './components/ActivityChart';
import LogTable from './components/LogTable';
import Settings from './components/Settings';
import Summary from './components/Summary';
import {
  IconChartPie3,
  IconActivityHeartbeat,
  IconListDetails,
  IconSettings,
} from '@tabler/icons-react';
import './App.css';

function App() {
  const theme = useMantineTheme();
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState({ logs: false, activity: false });
  const [logs, setLogs] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [settings, setSettings] = useState({
    honeypotName: "Default Honeypot",
    alertThreshold: 10
  });

  const [userInfo, setUserInfo] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'logs') fetchLogs();
    if (tab === 'activity') fetchActivityData();
  };

  // Функции загрузки данных
  const fetchLogs = async () => {
    try {
      setIsLoading(prev => ({ ...prev, logs: true }));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/attempts`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error("Failed to fetch logs");

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      alert("Ошибка загрузки логов");
    } finally {
      setIsLoading(prev => ({ ...prev, logs: false }));
    }
  };

  const fetchActivityData = async () => {
    try {
      setIsLoading(prev => ({ ...prev, activity: true }));

      const response = await fetch(`${process.env.REACT_APP_API_URL}/activity`, {
        credentials: 'include' // ⚠️ обязательно для cookies
      });

      if (!response.ok) throw new Error("Failed to fetch activity");

      const data = await response.json();
      setActivityData(data.activity || []);
    } catch (error) {
      console.error("Failed to fetch activity:", error);
      alert("Ошибка загрузки активности");
    } finally {
      setIsLoading(prev => ({ ...prev, activity: false }));
    }
  };


  // Инициализация приложения
  useEffect(() => {
    TelegramWebApp.ready();

    const initDataUnsafe = TelegramWebApp.initDataUnsafe;
    const user = initDataUnsafe?.user;
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#000000';
    if (!user || !initDataUnsafe.hash || !initDataUnsafe.auth_date) {
      console.error("⚠️ Missing Telegram WebApp initData fields");
      alert("Telegram авторизация недоступна.");
      return;
    }

    console.log("🧪 initDataUnsafe:", initDataUnsafe);

    // Отправляем в том виде, как требуется Flask-функцией check_response()
    fetch(`${process.env.REACT_APP_API_URL}/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        init_data: TelegramWebApp.initData
      }),
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error("Auth failed");
        return res.json();
      })
      .then(() => {
        setUserInfo(user);
        fetchLogs();
        fetchActivityData();
      })
      .catch(err => {
        console.error("❌ Auth failed", err);
        alert("Ошибка авторизации через Telegram.");
      });

    // const handleThemeChange = () => {
    //   const themeParams = TelegramWebApp.themeParams;
    //   document.body.style.backgroundColor = themeParams.bg_color || '#fff';
    //   document.body.style.color = themeParams.text_color || '#000';
    // };

    // TelegramWebApp.onEvent('themeChanged', handleThemeChange);
    // handleThemeChange();

    //fetchLogs();
    //fetchActivityData();
  }, []);

  // Отправка данных в бота
  const sendDataToBot = () => {
    TelegramWebApp.sendData("Hello from Honeypot Mini App!");
  };

  useEffect(() => {
    TelegramWebApp.MainButton.text = "Send Data to Bot";
    TelegramWebApp.MainButton.onClick(sendDataToBot);
    TelegramWebApp.MainButton.show();
  }, []);

  return (
    <MantineProvider
      theme={{
        fontFamily: 'Inter, sans-serif',
        colors: {
          brand: [
            '#f0f9ff',
            '#e0f3fc',
            '#b9e7fa',
            '#8ad8f4',
            '#5bc8ee',
            '#3fbce7',
            '#2baed2',
            '#1f8daa',
            '#156d86',
            '#0e4e61',
          ],
        },
        primaryColor: 'brand',
        primaryShade: { light: 5, dark: 4 },
        spacing: {
          xs: '0.5rem',
          sm: '0.75rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        },
        radius: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '0.75rem',
          lg: '1rem',
          xl: '1.25rem',
        },
        components: {
          Button: {
            styles: (theme) => ({
              root: {
                fontWeight: 600,
                letterSpacing: '0.025em',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                },
              },
            }),
          },
        },
      }}
      withGlobalStyles
      withNormalizeCSS
    >
      <AppShell
        header={{ height: 100 }}
        footer={{ height: 50 }}
        padding="md"
        className="app-shell"
      >
        {/* Header */}
        <AppShell.Header
          px="md"
          style={{
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
          }}
        >
          <Container size="xl">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Title
                order={2}
                ta="center"
                c="brand.7"
                style={{ letterSpacing: '-0.025em', fontWeight: 700 }}
              >
                🍯 Honeypot Monitor
              </Title>
              {userInfo && (
                <Text ta="center" size="sm" c="brand.5" mt={-4}>
                  Welcome back,{' '}
                  <Text span fw={600} c="brand.7">
                    {userInfo.first_name}
                  </Text>
                </Text>
              )}
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="pills"
              radius="xl"
            >
              <Tabs.List
                grow
                style={{
                  width: '100%',
                  backgroundColor: theme.colors.brand[0],
                  borderRadius: theme.radius.xl,
                  padding: 4,
                  border: `1px solid ${theme.colors.brand[2]}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                {['summary', 'activity', 'logs', 'settings'].map((tab) => (
                  <Tabs.Tab
                    key={tab}
                    value={tab}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontWeight: 600,
                      padding: '12px 0',
                      borderRadius: theme.radius.xl,
                      transition: 'all 0.2s ease',
                      backgroundColor: theme.colors.brand[1],
                      color: theme.colors.brand[8],
                      border: `1px solid ${theme.colors.brand[3]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.brand[2];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.brand[1];
                    }}
                  >
                    {tab}
                  </Tabs.Tab>
                ))}
              </Tabs.List>

            </Tabs>
          </Container>
        </AppShell.Header>

        {/* Main Content */}
        <AppShell.Main>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Container
              size="xl"
              py="xl"
              style={{
                minWidth: '100%', // 🔧 Не ограничивать вложенные компоненты
                paddingLeft: '1rem',
                paddingRight: '1rem',
              }}
            >
              <Paper
                p="xl"
                shadow="sm"
                radius="lg"
                style={{
                  minHeight: '60vh',
                  border: `1px solid ${theme.colors.brand[2]}`,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {activeTab === 'summary' && <Summary logs={logs} />}
                {activeTab === 'activity' && <ActivityChart data={activityData} />}
                {activeTab === 'logs' && <LogTable logs={logs} />}
                {activeTab === 'settings' && <Settings settings={settings} />}
              </Paper>
            </Container>
          </div>
        </AppShell.Main>


        {/* Footer */}
        <AppShell.Footer
          style={{
            border: 'none',
            boxShadow: '0 -1px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Container size="xl" py="sm">
            <Text size="xs" ta="center" c="dimmed" mt="sm">
              🔒 Secured by{' '}
              <Text span inherit fw={700}>
                Economisty Honeypot
              </Text>{' '}
              · 2025
            </Text>
          </Container>
        </AppShell.Footer>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
