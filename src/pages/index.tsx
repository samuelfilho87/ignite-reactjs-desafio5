import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function handleMorePosts(): void {
    fetch(postsPagination.next_page).then(res =>
      res.json().then(result => {
        setPosts([...posts, ...result.results]);
        setNextPage(result.next_page);
      })
    );
  }

  return (
    <>
      <Header />

      <main className={`${commonStyles.content} ${styles.homeArticle}`}>
        {posts.map(post => (
          <Link key={post.uid} href={`post/${post.uid}`}>
            <a>
              <article>
                <h2>{post.data.title}</h2>
                <h3>{post.data.subtitle}</h3>

                <footer>
                  <span>
                    <FiCalendar />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </footer>
              </article>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button type="button" onClick={handleMorePosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  return {
    props: {
      postsPagination: postsResponse,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
