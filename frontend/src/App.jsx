import { useEffect, useState } from 'react';

const rawApi = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
const API = rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`;
const quizQuestions = [
  { question: 'Which library is used to build this frontend?', options: ['React', 'MySQL', 'Spring MVC'], answer: 'React' },
  { question: 'Which language is commonly used with Spring Boot?', options: ['Java', 'CSS', 'SQL only'], answer: 'Java' },
  { question: 'Which command retrieves rows from a database?', options: ['SELECT', 'PAINT', 'RUNPAGE'], answer: 'SELECT' }
];

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('learnhub-user') || 'null'));
  const [page, setPage] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [answers, setAnswers] = useState({});
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (user) loadEnrollments(); }, [user]);

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed. Check backend connection.');
    return data;
  }
  async function loadCourses() {
    try { setCourses(await request('/courses')); }
    catch { setMessage('Could not load courses. Start the backend and check the API URL.'); }
  }
  async function loadEnrollments() {
    try { setEnrollments(await request(`/enrollments/${user.userId}`)); }
    catch { setMessage('Could not load your dashboard.'); }
  }
  async function submitAuth(e) {
    e.preventDefault(); setMessage('');
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const payload = authMode === 'login' ? { email: form.email, password: form.password } : form;
      const result = await request(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem('learnhub-user', JSON.stringify(result)); setUser(result);
      setPage('dashboard'); setMessage(`Welcome, ${result.name}!`);
    } catch (err) { setMessage(err.message); }
  }
  async function enroll(courseId) {
    if (!user) { setPage('auth'); setMessage('Please log in before enrolling.'); return; }
    try {
      const result = await request('/enroll', { method: 'POST', body: JSON.stringify({ userId: user.userId, courseId }) });
      setMessage(result.message); await loadEnrollments();
    } catch (err) { setMessage(err.message); }
  }
  async function finishCourse(enrollmentId) {
    try {
      await request('/progress', { method: 'POST', body: JSON.stringify({ enrollmentId, progress: 100 }) });
      setMessage('Course marked as completed.'); await loadEnrollments();
    } catch (err) { setMessage(err.message); }
  }
  function logout() {
    localStorage.removeItem('learnhub-user'); setUser(null); setEnrollments([]); setPage('courses'); setMessage('You have logged out.');
  }
  function submitQuiz(e) {
    e.preventDefault(); setQuizDone(true);
    const score = quizQuestions.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
    setMessage(`Quiz submitted: ${score} / ${quizQuestions.length}`);
  }
  const enrolledIds = enrollments.map(item => item.course.courseId);

  return <div className="app">
    <header className="topbar">
      <button className="brand" onClick={() => setPage('courses')}>LearnHub</button>
      <nav>
        <button className={page === 'courses' ? 'active' : ''} onClick={() => setPage('courses')}>Courses</button>
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => user ? setPage('dashboard') : (setPage('auth'), setMessage('Log in to view your dashboard.'))}>Dashboard</button>
        <button className={page === 'quiz' ? 'active' : ''} onClick={() => setPage('quiz')}>Quiz</button>
      </nav>
      <div className="account">{user ? <><span>{user.name}</span><button className="outline small" onClick={logout}>Logout</button></> : <button className="primary small" onClick={() => {setPage('auth');setMessage('');}}>Login</button>}</div>
    </header>

    <main>
      <section className="hero">
        <div><p className="eyebrow">LEARN AT YOUR OWN PACE</p><h1>Small steps.<br/><span>New skills.</span></h1><p>Explore practical courses, track your progress, and keep learning.</p><button className="primary" onClick={() => setPage('courses')}>Explore courses</button></div>
        <div className="hero-art"><div className="art-card"><div className="art-top">LEARNHUB / 01</div><div className="art-circle">L</div><strong>Learning<br/>in progress</strong><div className="art-line"><i/></div><small>Keep moving forward</small></div></div>
      </section>

      {message && <div className="notice"><span>{message}</span><button onClick={() => setMessage('')} aria-label="Dismiss">×</button></div>}

      {page === 'courses' && <section className="section">
        <div className="section-heading"><div><p className="eyebrow">COURSE LIBRARY</p><h2>Find your next skill</h2></div><span className="count">{courses.length} courses</span></div>
        <div className="course-grid">{courses.map((course, i) => <article className="course-card" key={course.courseId}>
          <div className={`course-art art-${i % 4}`}><span>0{i + 1}</span><strong>{course.courseName.split(' ').map(w => w[0]).join('').slice(0, 3)}</strong></div>
          <div className="course-content"><p className="eyebrow">SELF-PACED COURSE</p><h3>{course.courseName}</h3><p>{course.description}</p><div className="course-footer"><span>By {course.instructor}</span><button className={enrolledIds.includes(course.courseId) ? 'outline small' : 'primary small'} onClick={() => enroll(course.courseId)}>{enrolledIds.includes(course.courseId) ? 'Enrolled' : 'Enroll'}</button></div></div>
        </article>)}</div>
      </section>}

      {page === 'auth' && <section className="auth-wrap"><form className="auth-card" onSubmit={submitAuth}><p className="eyebrow">YOUR LEARNING SPACE</p><h2>{authMode === 'login' ? 'Welcome back' : 'Create an account'}</h2><p className="muted">Sign in to keep track of your courses.</p>
        {authMode === 'register' && <label>Name<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email<input type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input type="password" required value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="Enter password"/></label>
        <button className="primary full" type="submit">{authMode === 'login' ? 'Login' : 'Register'}</button>
        <p className="switch">{authMode === 'login' ? "New here?" : "Already registered?"} <button type="button" onClick={() => {setAuthMode(authMode === 'login' ? 'register' : 'login');setMessage('');}}> {authMode === 'login' ? 'Create account' : 'Login'} </button></p>
      </form></section>}

      {page === 'dashboard' && <section className="section"><div className="section-heading"><div><p className="eyebrow">STUDENT DASHBOARD</p><h2>{user ? `Hello, ${user.name}` : 'Your learning overview'}</h2></div></div>
        {!user ? <div className="empty"><p>Log in to view your enrolled courses.</p><button className="primary" onClick={() => setPage('auth')}>Login</button></div> : <>
        <div className="stats"><div><span>Enrolled courses</span><strong>{enrollments.length}</strong></div><div><span>Completed courses</span><strong>{enrollments.filter(e => e.progress === 100).length}</strong></div><div><span>Learning status</span><strong>Active</strong></div></div>
        <h3 className="subheading">My courses</h3>{enrollments.length === 0 ? <div className="empty">You haven't enrolled in a course yet. <button onClick={() => setPage('courses')}>Browse courses</button></div> : <div className="enrollment-list">{enrollments.map(e => <article className="enrollment" key={e.enrollmentId}><div><h3>{e.course.courseName}</h3><p>{e.course.instructor}</p><div className="progress"><span style={{width:`${e.progress}%`}}/></div><small>{e.progress}% complete</small></div><button className="outline small" onClick={() => finishCourse(e.enrollmentId)}>{e.progress === 100 ? 'Completed' : 'Mark complete'}</button></article>)}</div>}</>}
      </section>}

      {page === 'quiz' && <section className="section quiz-section"><p className="eyebrow">QUICK CHECK</p><h2>Learning basics quiz</h2><p className="muted">Choose one answer for each question.</p><form onSubmit={submitQuiz}>{quizQuestions.map((q,i)=><div className="question" key={i}><h3>{i+1}. {q.question}</h3>{q.options.map(option=><label className="option" key={option}><input type="radio" name={`q${i}`} value={option} required checked={answers[i]===option} onChange={() => setAnswers({...answers,[i]:option})}/>{option}</label>)}{quizDone && <small className={answers[i] === q.answer ? 'correct' : 'wrong'}>{answers[i] === q.answer ? 'Correct' : `Answer: ${q.answer}`}</small>}</div>)}<button className="primary" type="submit">Submit quiz</button></form></section>}
    </main>
    <footer><strong>LearnHub</strong><span>Simple learning. Steady progress.</span><small>Student project · React + Spring MVC + MySQL</small></footer>
  </div>;
}
