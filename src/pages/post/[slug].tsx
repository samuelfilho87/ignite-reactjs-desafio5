/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const [readingTime, setReadingTime] = useState(4);

  useEffect(() => {
    if (post.data.content) {
      const words = post.data.content.reduce((acc, cur) => {
        return acc + RichText.asText(cur.body).split(' ').length;
      }, 0);

      setReadingTime(Math.round(words / 200) + 1);
    }
  }, [post.data.content]);

  return (
    <>
      {router.isFallback && <h1 className={styles.isLoading}>Carregando...</h1>}

      <Header />

      <img
        src={post.data.banner.url}
        alt={post.data.title}
        className={styles.postBanner}
      />

      <article className={`${commonStyles.content} ${styles.postContent}`}>
        <h1>{post.data.title}</h1>

        <div className={styles.postStatus}>
          <span>
            <FiCalendar />
            {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
              locale: ptBR,
            })}
          </span>

          <span>
            <FiUser /> {post.data.author}
          </span>

          <span>
            <FiClock /> {readingTime} min
          </span>
        </div>

        {post.data.content.map(content => (
          <div key={content.heading}>
            <h2>{content.heading}</h2>
            <div
              className={styles.postContent}
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  return {
    paths: posts.results.map(post => {
      return {
        params: {
          slug: post.uid,
        },
      };
    }),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
