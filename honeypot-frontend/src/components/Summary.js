import React, { useMemo } from 'react';
import {
  Paper,
  Title,
  Text,
  List,
  Stack,
  Group,
  Divider,
  Badge,
  Box,
} from '@mantine/core';
import {
  IconChartBar,
  IconClock,
  IconMapPin,
  IconAlertTriangle,
} from '@tabler/icons-react';

function Summary({ logs }) {
  const summaryData = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    const totalAttempts = logs.length;

    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const latestTimestamp = new Date(sortedLogs[0].timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const ipCounts = {};
    logs.forEach((log) => {
      ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
    });
    const topIps = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([ip, count]) => `${ip} (${count}x)`);

    return {
      totalAttempts,
      latestTimestamp,
      topIps,
    };
  }, [logs]);

  return (
    <Paper
      withBorder
      radius="lg"
      shadow="md"
      p="lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: '#d0ebff',
      }}
    >
      <Stack spacing="lg">
        <Group spacing="xs">
          <IconChartBar size={22} color="#339af0" />
          <Title order={3} c="brand.7">
            Сводка Honeypot
          </Title>
        </Group>

        {!summaryData ? (
          <Text c="dimmed" ta="center">
            Нет данных для отображения
          </Text>
        ) : (
          <Stack spacing="md">
            <Group spacing="xs" noWrap>
              <IconAlertTriangle size={18} color="#228be6" />
              <Text size="sm" fw={500}>
                Всего срабатываний:
              </Text>
              <Badge size="sm" color="blue" variant="filled">
                {summaryData.totalAttempts}
              </Badge>
            </Group>

            <Group spacing="xs" noWrap>
              <IconClock size={18} color="#228be6" />
              <Text size="sm" fw={500}>
                Последнее срабатывание:
              </Text>
              <Text size="sm" c="gray.8">
                {summaryData.latestTimestamp}
              </Text>
            </Group>

            <Divider my="sm" variant="dashed" />

            <Group spacing="xs" align="flex-start" noWrap>
              <IconMapPin size={18} color="#228be6" style={{ marginTop: 4 }} />
              <Box>
                <Text size="sm" fw={500} mb={4}>
                  Топ 3 IP-адреса:
                </Text>
                <List size="sm" spacing="xs" center>
                  {summaryData.topIps.map((ip, idx) => (
                    <List.Item key={idx}>{ip}</List.Item>
                  ))}
                </List>
              </Box>
            </Group>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default Summary;
