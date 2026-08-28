import { useNavigate, useParams } from 'react-router';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';

export const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return <TaskDetailDrawer taskId={id ? Number(id) : undefined} onClose={() => navigate(-1)} />;
};
